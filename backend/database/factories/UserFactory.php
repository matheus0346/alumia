<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/** @extends Factory<User> */
class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'username' => fake()->unique()->userName(),
            'password' => Hash::make('Synthetic-test-password-123!'),
            'role' => 'admin',
            'active' => true,
            'must_change_password' => false,
            'credential_version' => 1,
        ];
    }
}
