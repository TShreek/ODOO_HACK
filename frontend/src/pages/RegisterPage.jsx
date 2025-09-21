import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, User, Mail, Lock, UserPlus } from 'lucide-react'
import useAuthStore from '../stores/authStore'

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { register: registerUser, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    try {
      clearError()
      await registerUser(data)
      navigate('/', { replace: true })
    } catch (error) {
      // Error is handled by the store
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <span className="text-2xl font-bold text-white">SA</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create account</h1>
          <p className="text-gray-600">Get started with Shiv Accounts today</p>
        </div>

        {/* Register Form */}
        <div className="card p-6">
          {error && (
            <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-xl">
              <p className="text-sm text-error-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('name', { 
                    required: 'Full name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                  type="text"
                  className={`input pl-10 ${errors.name ? 'border-error-500 focus:ring-error-500' : ''}`}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
              )}
            </div>

            {/* Login ID Field */}
            <div>
              <label htmlFor="login_id" className="block text-sm font-medium text-gray-700 mb-2">
                Login ID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('login_id', { 
                    required: 'Login ID is required',
                    minLength: { value: 6, message: 'Login ID must be between 6-12 characters' },
                    maxLength: { value: 12, message: 'Login ID must be between 6-12 characters' },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: 'Login ID can only contain letters, numbers, and underscores'
                    }
                  })}
                  type="text"
                  className={`input pl-10 ${errors.login_id ? 'border-error-500 focus:ring-error-500' : ''}`}
                  placeholder="Choose a unique login ID (6-12 chars)"
                />
              </div>
              {errors.login_id && (
                <p className="mt-1 text-sm text-error-600">{errors.login_id.message}</p>
              )}
            </div>

            {/* Role Selection Field */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-gray-500">(User Rights)</span>
              </label>
              <select
                {...register('role', { required: 'Role selection is required' })}
                className={`input ${errors.role ? 'border-error-500 focus:ring-error-500' : ''}`}
              >
                <option value="">Select Role</option>
                <option value="invoicing_user">Invoicing User - Can create invoices but cannot modify master data</option>
                <option value="admin">Admin - Full access rights</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-error-600">{errors.role.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Invoicing user: Can create invoices, payments but cannot modify master data<br/>
                Admin: Full access to all features and master data
              </p>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email_id" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('email_id', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className={`input pl-10 ${errors.email_id ? 'border-error-500 focus:ring-error-500' : ''}`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email_id && (
                <p className="mt-1 text-sm text-error-600">{errors.email_id.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be more than 8 characters' },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                      message: 'Password must contain small case, large case, and special character'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className={`input pl-10 pr-10 ${errors.password ? 'border-error-500 focus:ring-error-500' : ''}`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Password must contain: small case, large case, number, and special character
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className={`input pl-10 ${errors.confirmPassword ? 'border-error-500 focus:ring-error-500' : ''}`}
                  placeholder="Confirm your password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-error-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2025 Shiv Accounts. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage