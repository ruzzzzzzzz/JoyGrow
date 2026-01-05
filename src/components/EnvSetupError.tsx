/**
 * Environment Setup Error Component
 * 
 * Displays helpful setup instructions when environment variables are missing
 */

import { AlertCircle, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

interface EnvSetupErrorProps {
  missingVar: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY';
}

export function EnvSetupError({ missingVar }: EnvSetupErrorProps) {
  const [copied, setCopied] = useState(false);

  const setupSteps = `# 1. Edit the .env file in project root
# (File already exists - just fill it in!)

# 2. Get your Supabase credentials
# Go to: https://supabase.com/dashboard
# → Your Project → Settings → API

# 3. Fill in your .env file with:
# VITE_SUPABASE_URL=https://your-project-id.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key-here

# 4. Restart the dev server
npm run dev`;

  const handleCopy = () => {
    navigator.clipboard.writeText(setupSteps);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Environment Setup Required</h1>
          </div>
          <p className="text-pink-100">
            JoyGrow needs to be configured before you can use it
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Missing Configuration</h3>
                <p className="text-red-700 text-sm">
                  <code className="bg-red-100 px-2 py-0.5 rounded">{missingVar}</code> is not set
                </p>
              </div>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Quick Setup (5 minutes)</h2>

            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Edit the .env file in project root</h3>
                <code className="block bg-gray-100 p-3 rounded text-sm text-gray-800">
                  # File already exists - just fill it in!
                </code>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Get Supabase credentials</h3>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">Supabase Dashboard</a></li>
                  <li>Select your project (or create a new one)</li>
                  <li>Navigate to <strong>Settings → API</strong></li>
                  <li>Copy <strong>Project URL</strong> and <strong>anon public</strong> key</li>
                </ol>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Fill in your .env file</h3>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <code className="block text-gray-800">VITE_SUPABASE_URL=https://your-project-id.supabase.co</code>
                  <code className="block text-gray-800 mt-1">VITE_SUPABASE_ANON_KEY=your-anon-key-here</code>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Restart the dev server</h3>
                <code className="block bg-gray-100 p-3 rounded text-sm text-gray-800">
                  npm run dev
                </code>
              </div>
            </div>
          </div>

          {/* Copy All Steps */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleCopy}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Setup Commands
                </>
              )}
            </Button>
          </div>

          {/* Help Links */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              📚 Need More Help?
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • See <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">/DATABASE-WORK-NA.md</code> for complete database setup guide
              </li>
              <li>
                • See <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">/QUICK_ENV_SETUP.md</code> for quick setup steps
              </li>
              <li>
                • Check <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">/.env.example</code> for all configuration options
              </li>
            </ul>
          </div>

          {/* Security Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-1 flex items-center gap-2">
              🔒 Important
            </h3>
            <p className="text-sm text-amber-800">
              <strong>Never commit .env to Git!</strong> This file contains your private credentials.
              The file is already listed in <code className="bg-amber-100 px-1.5 py-0.5 rounded">.gitignore</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}