<?php

namespace Tests\Feature;

use App\Models\CredentialEvent;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'Synthetic-test-password-123!';

    private function schoolUser(bool $temporary = false): User
    {
        $school = School::create(['name' => 'Escola sintética']);

        return User::factory()->create(['role' => 'school', 'school_id' => $school->id, 'must_change_password' => $temporary]);
    }

    private function login(User $user): void
    {
        $this->postJson('/api/v1/auth/institution/login', ['username' => $user->username, 'password' => self::PASSWORD])->assertOk();
    }

    private function student(User $user): array
    {
        $token = bin2hex(random_bytes(32));
        $student = Student::create(['school_id' => $user->school_id, 'code' => 'SYNTHETIC-01', 'token_hash' => hash('sha256', $token)]);

        return [$student, $token];
    }

    public function test_anonymous_requests_cannot_reach_management_or_enumerate_students(): void
    {
        foreach (['/api/v1/auth/session', '/api/v1/admin/schools', '/api/v1/school', '/api/v1/school/students'] as $url) {
            $this->getJson($url)->assertUnauthorized();
        }
        $this->postJson('/api/v1/school/students/999999/token')->assertUnauthorized();
    }

    public function test_institution_login_normalizes_username_and_does_not_expose_hash(): void
    {
        $user = $this->schoolUser();
        $this->postJson('/api/v1/auth/institution/login', ['username' => strtoupper($user->username), 'password' => self::PASSWORD])
            ->assertOk()->assertJsonPath('identity.type', 'school')
            ->assertJsonMissingPath('identity.password')->assertHeader('Cache-Control', 'no-store, private');
        $this->getJson('/api/v1/auth/session')->assertOk()->assertJsonPath('identity.id', $user->id);
    }

    public function test_invalid_unknown_and_disabled_accounts_have_generic_errors(): void
    {
        $user = $this->schoolUser();
        $this->postJson('/api/v1/auth/institution/login', ['username' => $user->username, 'password' => 'wrong'])
            ->assertUnprocessable()->assertJsonPath('errors.credentials.0', 'Credenciais inválidas.');
        $this->postJson('/api/v1/auth/institution/login', ['username' => 'does-not-exist', 'password' => 'wrong'])
            ->assertUnprocessable()->assertJsonPath('errors.credentials.0', 'Credenciais inválidas.');
        $user->update(['active' => false]);
        $this->postJson('/api/v1/auth/institution/login', ['username' => $user->username, 'password' => self::PASSWORD])
            ->assertUnprocessable()->assertJsonPath('errors.credentials.0', 'Credenciais inválidas.');
    }

    public function test_temporary_password_blocks_school_resources_until_changed(): void
    {
        $user = $this->schoolUser(true);
        $this->login($user);
        $this->getJson('/api/v1/school/students')->assertForbidden()->assertJsonPath('error', 'password_change_required');
        $this->putJson('/api/v1/auth/password', ['current_password' => self::PASSWORD, 'password' => 'New-synthetic-password-456!', 'password_confirmation' => 'New-synthetic-password-456!'])->assertNoContent();
        $this->getJson('/api/v1/school/students')->assertOk();
        $this->assertFalse($user->fresh()->must_change_password);
        $this->assertTrue(Hash::check('New-synthetic-password-456!', $user->fresh()->password));
        $this->assertDatabaseHas('credential_events', ['target_user_id' => $user->id, 'action' => 'password_changed']);
    }

    public function test_password_change_requires_the_current_password_and_confirmation(): void
    {
        $user = $this->schoolUser();
        $this->login($user);
        $this->putJson('/api/v1/auth/password', ['current_password' => 'incorrect', 'password' => 'New-synthetic-password-456!', 'password_confirmation' => 'New-synthetic-password-456!'])->assertUnprocessable();
        $this->putJson('/api/v1/auth/password', ['current_password' => self::PASSWORD, 'password' => 'short', 'password_confirmation' => 'different'])->assertUnprocessable();
        $this->assertTrue(Hash::check(self::PASSWORD, $user->fresh()->password));
    }

    public function test_login_attempts_are_limited(): void
    {
        $user = $this->schoolUser();
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/institution/login', ['username' => $user->username, 'password' => 'wrong'])->assertUnprocessable();
        }
        $this->postJson('/api/v1/auth/institution/login', ['username' => $user->username, 'password' => self::PASSWORD])->assertTooManyRequests();
    }

    public function test_admin_can_create_school_account_with_one_time_temporary_password(): void
    {
        $admin = User::factory()->create();
        $this->login($admin);
        $response = $this->postJson('/api/v1/admin/schools', ['name' => 'Escola sintética nova', 'username' => 'SCHOOL-NEW', 'role' => 'admin'])
            ->assertCreated()->assertJsonPath('username', 'school-new')->assertHeader('Cache-Control', 'no-store, private');
        $user = User::where('username', 'school-new')->firstOrFail();
        $temporary = $response->json('temporary_password');
        $this->assertTrue(Hash::check($temporary, $user->password));
        $this->assertSame('school', $user->role);
        $this->assertTrue($user->must_change_password);
        $this->getJson('/api/v1/admin/schools')->assertOk()->assertDontSee($temporary)->assertJsonMissingPath('temporary_password');
        $this->assertDatabaseHas('credential_events', ['actor_user_id' => $admin->id, 'target_user_id' => $user->id, 'action' => 'school_created']);
    }

    public function test_school_account_cannot_create_schools_or_reset_institutional_passwords(): void
    {
        $user = $this->schoolUser();
        $this->login($user);
        $this->postJson('/api/v1/admin/schools', ['name' => 'Unauthorized', 'username' => 'forbidden'])->assertForbidden();
        $this->postJson('/api/v1/admin/schools/'.$user->school_id.'/password')->assertForbidden();
    }

    public function test_admin_reset_invalidates_old_password_and_sessions(): void
    {
        $school = $this->schoolUser();
        $admin = User::factory()->create();
        $this->login($admin);
        $response = $this->postJson('/api/v1/admin/schools/'.$school->school_id.'/password')->assertOk();
        $this->assertTrue(Hash::check($response->json('temporary_password'), $school->fresh()->password));
        $this->assertFalse(Hash::check(self::PASSWORD, $school->fresh()->password));
        $this->assertSame(2, $school->fresh()->credential_version);
        $this->actingAs($school, 'web')->withSession(['identity_version' => 1]);
        $this->getJson('/api/v1/auth/session')->assertUnauthorized()->assertJsonPath('error', 'session_revoked');
    }

    public function test_students_and_global_admin_cannot_read_school_student_lists(): void
    {
        $user = $this->schoolUser();
        [$student, $token] = $this->student($user);
        $this->postJson('/api/v1/auth/student/login', ['token' => $token])->assertOk()->assertJsonPath('identity.type', 'student');
        $this->getJson('/api/v1/school/students')->assertForbidden();
        $this->getJson('/api/v1/admin/schools')->assertForbidden();
        $this->putJson('/api/v1/auth/password', ['password' => 'test'])->assertForbidden();
        $this->login(User::factory()->create());
        $this->getJson('/api/v1/school/students')->assertForbidden();
    }

    public function test_school_lists_only_its_students_and_ignores_injected_school_id(): void
    {
        $user = $this->schoolUser();
        $other = $this->schoolUser();
        [$otherStudent] = $this->student($other);
        $this->login($user);
        $response = $this->postJson('/api/v1/school/students', ['code' => 'test-01', 'school_id' => $other->school_id])->assertCreated();
        $id = $response->json('student.id');
        $token = $response->json('token');
        $this->assertSame($user->school_id, Student::findOrFail($id)->school_id);
        $this->assertSame(hash('sha256', $token), Student::findOrFail($id)->token_hash);
        $this->assertSame(64, strlen($token));
        $this->getJson('/api/v1/school/students?school_id='.$other->school_id)->assertOk()
            ->assertJsonCount(1, 'students.data')->assertJsonPath('students.data.0.id', $id)->assertDontSee($token);
        $this->postJson('/api/v1/school/students/'.$otherStudent->id.'/token')->assertNotFound();
        $this->deleteJson('/api/v1/school/students/'.$otherStudent->id.'/token')->assertNotFound();
        $this->assertTrue($otherStudent->fresh()->active);
    }

    public function test_token_rotation_revokes_old_token_and_existing_student_session(): void
    {
        $user = $this->schoolUser();
        [$student, $oldToken] = $this->student($user);
        $this->login($user);
        $newToken = $this->postJson('/api/v1/school/students/'.$student->id.'/token')->assertOk()->json('token');
        $this->assertNotSame($oldToken, $newToken);
        $this->postJson('/api/v1/auth/student/login', ['token' => $oldToken])->assertUnprocessable();
        $this->postJson('/api/v1/auth/student/login', ['token' => $newToken])->assertOk();
        $student->refresh();
        $student->increment('token_version');
        $this->getJson('/api/v1/auth/session')->assertUnauthorized()->assertJsonPath('error', 'session_revoked');
    }

    public function test_revoked_token_cannot_authenticate(): void
    {
        $user = $this->schoolUser();
        [$student, $token] = $this->student($user);
        $this->login($user);
        $this->deleteJson('/api/v1/school/students/'.$student->id.'/token')->assertOk();
        $this->postJson('/api/v1/auth/student/login', ['token' => $token])->assertUnprocessable();
    }

    public function test_suspending_school_blocks_an_existing_session(): void
    {
        $user = $this->schoolUser();
        $this->login($user);
        $user->school->update(['active' => false]);
        $this->getJson('/api/v1/school')->assertForbidden()->assertJsonPath('error', 'access_suspended');
    }

    public function test_logout_clears_both_guards(): void
    {
        $this->login($this->schoolUser());
        $this->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->getJson('/api/v1/auth/session')->assertUnauthorized();
    }

    public function test_mutations_enforce_csrf_outside_the_normal_test_bypass(): void
    {
        $this->app->bind(PreventRequestForgery::class, fn ($app) => new class($app, $app->make('encrypter')) extends PreventRequestForgery
        {
            protected function runningUnitTests()
            {
                return false;
            }
        });
        $user = $this->schoolUser();
        $this->postJson('/api/v1/auth/institution/login', ['username' => $user->username, 'password' => self::PASSWORD])->assertStatus(419);
        $token = $this->getJson('/api/v1/auth/csrf')->assertOk()->json('csrf_token');
        $this->withSession(['_token' => $token])->postJson('/api/v1/auth/institution/login', ['username' => $user->username, 'password' => self::PASSWORD], ['X-CSRF-TOKEN' => $token])->assertOk();
    }

    public function test_public_registration_and_password_recovery_do_not_exist(): void
    {
        foreach (['/api/v1/register', '/api/v1/forgot-password', '/api/v1/reset-password'] as $url) {
            $this->postJson($url)->assertNotFound();
        }
    }

    public function test_bootstrap_command_creates_no_default_password_and_audits_creation(): void
    {
        $this->artisan('alumia:admin:create', ['username' => 'synthetic-admin'])
            ->expectsQuestion('Senha inicial (mínimo 12 caracteres)', self::PASSWORD)
            ->expectsOutput('Administrador criado. Nenhuma senha foi gravada na saída.')
            ->assertSuccessful();
        $user = User::where('username', 'synthetic-admin')->firstOrFail();
        $this->assertSame('admin', $user->role);
        $this->assertNull($user->school_id);
        $this->assertTrue(Hash::check(self::PASSWORD, $user->password));
        $this->assertDatabaseHas('credential_events', ['target_user_id' => $user->id, 'action' => 'admin_created']);
        $this->assertSame(1, CredentialEvent::count());
    }
}
