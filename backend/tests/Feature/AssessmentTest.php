<?php

namespace Tests\Feature;

use App\Models\AssessmentPeriod;
use App\Models\AssessmentSubmission;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class AssessmentTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'Synthetic-test-password-123!';

    private const TEXT = 'Texto sintético de teste, sem dados reais.';

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    private function at(string $spTime): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse($spTime, 'America/Sao_Paulo'));
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'school_id' => null, 'must_change_password' => false]);
    }

    private function school(string $name = 'Escola sintética'): array
    {
        $school = School::create(['name' => $name]);
        $user = User::factory()->create(['role' => 'school', 'school_id' => $school->id, 'must_change_password' => false]);

        return [$school, $user];
    }

    private function student(School $school, string $code = 'SYN-01'): array
    {
        $token = bin2hex(random_bytes(32));

        return [Student::create(['school_id' => $school->id, 'code' => $code, 'token_hash' => hash('sha256', $token)]), $token];
    }

    private function loginInstitution(User $user): void
    {
        $this->postJson('/api/v1/auth/institution/login', ['username' => $user->username, 'password' => self::PASSWORD])->assertOk();
    }

    private function loginStudent(string $token): void
    {
        $this->postJson('/api/v1/auth/student/login', ['token' => $token])->assertOk();
    }

    private function logout(): void
    {
        $this->postJson('/api/v1/auth/logout')->assertNoContent();
    }

    private function period(School $school, string $startDate = '2026-11-23'): AssessmentPeriod
    {
        [$start, $end] = AssessmentPeriod::windowFor($startDate);

        return AssessmentPeriod::create(['school_id' => $school->id, 'starts_at' => $start, 'ends_at' => $end, 'created_by_user_id' => $this->admin()->id]);
    }

    public function test_window_is_seven_days_in_sao_paulo_time(): void
    {
        [$start, $end] = AssessmentPeriod::windowFor('2026-11-23');
        $this->assertSame('2026-11-23 00:00:00', $start->setTimezone('America/Sao_Paulo')->format('Y-m-d H:i:s'));
        $this->assertSame('2026-11-29 23:59:59', $end->setTimezone('America/Sao_Paulo')->format('Y-m-d H:i:s'));
        $this->assertSame('2026-11-23 03:00:00', $start->format('Y-m-d H:i:s'));
    }

    public function test_only_general_admin_creates_lists_and_closes_periods(): void
    {
        $this->at('2026-11-22 10:00:00');
        [$school, $schoolUser] = $this->school();
        $admin = $this->admin();
        $this->loginInstitution($admin);
        $this->postJson("/api/v1/admin/schools/{$school->id}/assessment-periods", ['start_date' => '2026-11-23'])->assertCreated()->assertJsonPath('period.status', 'scheduled');
        $this->getJson("/api/v1/admin/schools/{$school->id}/assessment-periods")->assertOk()->assertJsonPath('periods.data.0.submissions_count', 0);
        $period = AssessmentPeriod::firstOrFail();
        $this->postJson("/api/v1/admin/assessment-periods/{$period->id}/close")->assertOk()->assertJsonPath('period.status', 'closed');
        $this->logout();
        $this->loginInstitution($schoolUser);
        $this->postJson("/api/v1/admin/schools/{$school->id}/assessment-periods", ['start_date' => '2026-12-01'])->assertForbidden();
        $this->postJson("/api/v1/admin/assessment-periods/{$period->id}/close")->assertForbidden();
        $this->assertSame(1, AssessmentPeriod::count());
    }

    public function test_period_creation_rejects_past_dates_bad_dates_and_overlaps(): void
    {
        $this->at('2026-11-22 10:00:00');
        [$school] = $this->school();
        $this->loginInstitution($this->admin());
        $url = "/api/v1/admin/schools/{$school->id}/assessment-periods";
        $this->postJson($url, ['start_date' => '2026-11-21'])->assertUnprocessable();
        $this->postJson($url, ['start_date' => '23/11/2026'])->assertUnprocessable();
        $this->postJson($url, [])->assertUnprocessable();
        $this->postJson($url, ['start_date' => '2026-11-22'])->assertCreated();
        $this->postJson($url, ['start_date' => '2026-11-28'])->assertUnprocessable();
        $this->postJson($url, ['start_date' => '2026-11-29'])->assertCreated();
        $this->postJson('/api/v1/admin/schools/999999/assessment-periods', ['start_date' => '2026-12-20'])->assertNotFound();
    }

    public function test_student_sees_open_period_and_submits_once(): void
    {
        $this->at('2026-11-24 09:00:00');
        [$school] = $this->school();
        [$student, $token] = $this->student($school);
        $period = $this->period($school);
        $this->loginStudent($token);
        $this->getJson('/api/v1/student/assessment')->assertOk()->assertJsonPath('period.id', $period->id)->assertJsonPath('submitted', false)->assertJsonPath('max_length', 5000);
        $this->postJson("/api/v1/student/assessment-periods/{$period->id}/submission", ['text' => self::TEXT])->assertCreated()->assertJsonPath('submitted', true);
        $this->postJson("/api/v1/student/assessment-periods/{$period->id}/submission", ['text' => 'Outro texto'])->assertStatus(409)->assertJsonPath('error', 'already_submitted');
        $this->getJson('/api/v1/student/assessment')->assertJsonPath('submitted', true);
        $this->assertSame(1, AssessmentSubmission::count());
        $this->assertSame(self::TEXT, AssessmentSubmission::first()->body);
    }

    public function test_database_enforces_one_text_per_student_per_period(): void
    {
        [$school] = $this->school();
        [$student] = $this->student($school);
        $period = $this->period($school);
        $row = ['assessment_period_id' => $period->id, 'student_id' => $student->id, 'body' => 'a', 'submitted_at' => now()];
        AssessmentSubmission::create($row);
        $this->expectException(UniqueConstraintViolationException::class);
        AssessmentSubmission::create($row);
    }

    public function test_submission_window_boundaries_in_sao_paulo_time(): void
    {
        [$school] = $this->school();
        [$student, $token] = $this->student($school);
        $period = $this->period($school, '2026-11-23');
        $url = "/api/v1/student/assessment-periods/{$period->id}/submission";
        $this->loginStudent($token);
        $this->at('2026-11-22 23:59:59');
        $this->postJson($url, ['text' => self::TEXT])->assertStatus(409)->assertJsonPath('error', 'period_closed');
        $this->getJson('/api/v1/student/assessment')->assertJsonPath('period', null);
        $this->at('2026-11-29 23:59:59');
        $this->getJson('/api/v1/student/assessment')->assertJsonPath('period.id', $period->id);
        $this->postJson($url, ['text' => self::TEXT])->assertCreated();
        $this->assertSame(1, AssessmentSubmission::count());
    }

    public function test_first_second_opens_and_next_second_after_the_last_closes(): void
    {
        [$school] = $this->school();
        [, $token] = $this->student($school);
        $period = $this->period($school, '2026-11-23');
        $url = "/api/v1/student/assessment-periods/{$period->id}/submission";
        $this->loginStudent($token);
        $this->at('2026-11-30 00:00:00');
        $this->postJson($url, ['text' => self::TEXT])->assertStatus(409)->assertJsonPath('error', 'period_closed');
        $this->at('2026-11-23 00:00:00');
        $this->postJson($url, ['text' => self::TEXT])->assertCreated();
    }

    public function test_closed_by_admin_blocks_even_inside_the_window(): void
    {
        $this->at('2026-11-24 09:00:00');
        [$school] = $this->school();
        [, $token] = $this->student($school);
        $period = $this->period($school);
        $period->update(['closed_at' => now()]);
        $this->loginStudent($token);
        $this->postJson("/api/v1/student/assessment-periods/{$period->id}/submission", ['text' => self::TEXT])->assertStatus(409);
        $this->getJson('/api/v1/student/assessment')->assertJsonPath('period', null);
        $this->assertSame(0, AssessmentSubmission::count());
    }

    public function test_student_cannot_submit_to_another_schools_period(): void
    {
        $this->at('2026-11-24 09:00:00');
        [$schoolA] = $this->school('A');
        [$schoolB] = $this->school('B');
        [, $token] = $this->student($schoolA);
        $foreign = $this->period($schoolB);
        $this->loginStudent($token);
        $this->postJson("/api/v1/student/assessment-periods/{$foreign->id}/submission", ['text' => self::TEXT])->assertNotFound();
        $this->getJson('/api/v1/student/assessment')->assertJsonPath('period', null);
        $this->assertSame(0, AssessmentSubmission::count());
    }

    public function test_text_validation_is_explicit_and_does_not_echo_input(): void
    {
        $this->at('2026-11-24 09:00:00');
        [$school] = $this->school();
        [, $token] = $this->student($school);
        $period = $this->period($school);
        $this->loginStudent($token);
        $url = "/api/v1/student/assessment-periods/{$period->id}/submission";
        $this->postJson($url, [])->assertUnprocessable();
        $this->postJson($url, ['text' => "   \n  "])->assertUnprocessable();
        $secret = 'SEGREDO-'.str_repeat('x', 5000);
        $response = $this->postJson($url, ['text' => $secret])->assertUnprocessable();
        $this->assertStringNotContainsString('SEGREDO-', $response->getContent());
        $this->postJson($url, ['text' => str_repeat('a', 5000)])->assertCreated();
    }

    public function test_save_failure_is_explicit_and_never_logs_the_text(): void
    {
        $this->at('2026-11-24 09:00:00');
        [$school] = $this->school();
        [, $token] = $this->student($school);
        $period = $this->period($school);
        $this->loginStudent($token);
        $logged = [];
        Log::listen(function ($event) use (&$logged) {
            $logged[] = $event->message.json_encode($event->context);
        });
        AssessmentSubmission::creating(fn () => throw new \RuntimeException('falha com TEXTO-SECRETO'));
        $this->postJson("/api/v1/student/assessment-periods/{$period->id}/submission", ['text' => 'TEXTO-SECRETO'])
            ->assertStatus(503)->assertJsonPath('error', 'save_failed')->assertJsonMissingPath('submitted');
        $this->assertSame(0, AssessmentSubmission::count());
        $this->assertStringNotContainsString('TEXTO-SECRETO', implode("\n", $logged));
    }

    public function test_school_reads_only_its_own_periods_and_texts(): void
    {
        $this->at('2026-11-24 09:00:00');
        [$schoolA, $userA] = $this->school('A');
        [$schoolB] = $this->school('B');
        [$studentA, $tokenA] = $this->student($schoolA, 'A-01');
        [$studentB, $tokenB] = $this->student($schoolB, 'B-01');
        $periodA = $this->period($schoolA);
        $periodB = $this->period($schoolB);
        $this->loginStudent($tokenA);
        $this->postJson("/api/v1/student/assessment-periods/{$periodA->id}/submission", ['text' => 'texto da escola A'])->assertCreated();
        $this->logout();
        $this->loginStudent($tokenB);
        $this->postJson("/api/v1/student/assessment-periods/{$periodB->id}/submission", ['text' => 'texto da escola B'])->assertCreated();
        $this->logout();
        $this->loginInstitution($userA);
        $this->getJson('/api/v1/school/assessment-periods')->assertOk()->assertJsonCount(1, 'periods.data')->assertJsonPath('periods.data.0.id', $periodA->id)->assertJsonPath('periods.data.0.submissions_count', 1);
        $this->getJson("/api/v1/school/assessment-periods/{$periodA->id}/submissions")->assertOk()
            ->assertJsonPath('submissions.data.0.student_code', 'A-01')->assertJsonPath('submissions.data.0.text', 'texto da escola A')->assertJsonCount(1, 'submissions.data');
        $this->getJson("/api/v1/school/assessment-periods/{$periodB->id}/submissions")->assertNotFound();
    }

    public function test_general_admin_cannot_read_texts_and_students_cannot_read_school_or_admin_routes(): void
    {
        $this->at('2026-11-24 09:00:00');
        [$school, $schoolUser] = $this->school();
        [, $token] = $this->student($school);
        $period = $this->period($school);
        $this->loginStudent($token);
        $this->postJson("/api/v1/student/assessment-periods/{$period->id}/submission", ['text' => 'conteudo-privado'])->assertCreated();
        $this->getJson("/api/v1/school/assessment-periods/{$period->id}/submissions")->assertForbidden();
        $this->getJson("/api/v1/admin/schools/{$school->id}/assessment-periods")->assertForbidden();
        $this->logout();
        $this->loginInstitution($this->admin());
        $this->getJson("/api/v1/school/assessment-periods/{$period->id}/submissions")->assertForbidden();
        $this->getJson('/api/v1/student/assessment')->assertForbidden();
        $this->postJson("/api/v1/student/assessment-periods/{$period->id}/submission", ['text' => 'x'])->assertForbidden();
        $list = $this->getJson("/api/v1/admin/schools/{$school->id}/assessment-periods")->assertOk();
        $this->assertStringNotContainsString('conteudo-privado', $list->getContent());
        $this->assertStringNotContainsString('"text"', $list->getContent());
    }

    public function test_anonymous_requests_are_rejected(): void
    {
        foreach (['/api/v1/student/assessment', '/api/v1/school/assessment-periods', '/api/v1/school/assessment-periods/1/submissions', '/api/v1/admin/schools/1/assessment-periods'] as $url) {
            $this->getJson($url)->assertUnauthorized();
        }
        $this->postJson('/api/v1/student/assessment-periods/1/submission', ['text' => 'x'])->assertUnauthorized();
        $this->postJson('/api/v1/admin/assessment-periods/1/close')->assertUnauthorized();
    }

    public function test_revoked_student_session_cannot_submit(): void
    {
        $this->at('2026-11-24 09:00:00');
        [$school] = $this->school();
        [$student, $token] = $this->student($school);
        $period = $this->period($school);
        $this->loginStudent($token);
        $student->refresh()->update(['token_version' => $student->token_version + 1]);
        $this->postJson("/api/v1/student/assessment-periods/{$period->id}/submission", ['text' => self::TEXT])->assertUnauthorized();
        $this->assertSame(0, AssessmentSubmission::count());
    }

    public function test_submission_requires_csrf_and_session(): void
    {
        $this->app->bind(PreventRequestForgery::class, fn ($app) => new class($app, $app->make('encrypter')) extends PreventRequestForgery
        {
            protected function runningUnitTests()
            {
                return false;
            }
        });
        $this->at('2026-11-24 09:00:00');
        [$school] = $this->school();
        [, $token] = $this->student($school);
        $period = $this->period($school);
        $url = "/api/v1/student/assessment-periods/{$period->id}/submission";
        $csrf = $this->getJson('/api/v1/auth/csrf')->json('csrf_token');
        $this->withSession(['_token' => $csrf])->postJson('/api/v1/auth/student/login', ['token' => $token], ['X-CSRF-TOKEN' => $csrf])->assertOk();
        $this->postJson($url, ['text' => self::TEXT])->assertStatus(419);
        $this->assertSame(0, AssessmentSubmission::count());
        $csrf = $this->getJson('/api/v1/auth/csrf')->json('csrf_token');
        $this->withSession(['_token' => $csrf])->postJson($url, ['text' => self::TEXT], ['X-CSRF-TOKEN' => $csrf])->assertCreated();
    }
}
