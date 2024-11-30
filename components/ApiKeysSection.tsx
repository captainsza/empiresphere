/* eslint-disable @typescript-eslint/no-unused-vars */
// frontend/components/ApiKeysSection.tsx

import React, { useState } from 'react';
import { Key, Copy, Sparkles, RefreshCw, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

interface ApiKey {
  key: string;
  createdAt: string;
}

interface ApiKeysSectionProps {
  apiKeys: ApiKey[];
  isLoading: boolean;
  generateApiKey: () => void;
  copyToClipboard: (text: string) => void;
}

const ApiKeysSection: React.FC<ApiKeysSectionProps> = ({
  apiKeys,
  isLoading,
  generateApiKey,
  copyToClipboard,
}) => {
  const [showDocumentation, setShowDocumentation] = useState(false);

  return (
    <div className="bg-[#1e1e2e] rounded-2xl p-6 shadow-2xl border border-blue-900/30">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <Key className="text-blue-400" />
          <h2 className="text-2xl font-semibold">API Keys</h2>
        </div>

        <div className="flex items-center space-x-2">
          {/* Documentation Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDocumentation(!showDocumentation)}
            className="text-blue-400 hover:text-blue-600 transition-colors"
            title="View API Keys Documentation"
          >
            <Info size={20} />
          </motion.button>

          {/* Generate API Key Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={generateApiKey}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 
              px-4 py-2 rounded-full flex items-center 
              space-x-2 hover:from-blue-700 hover:to-purple-700 
              transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="animate-spin" />
            ) : (
              <Sparkles />
            )}
            <span>Generate Key</span>
          </motion.button>
        </div>
      </div>

      {/* Documentation Modal */}
      <AnimatePresence>
        {showDocumentation && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#1e1e2e] rounded-lg p-6 w-11/12 md:w-2/3 lg:w-1/2 backdrop-filter backdrop-blur-lg bg-opacity-80"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">API Keys Documentation</h3>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowDocumentation(false)}
                  className="text-red-500 hover:text-red-700"
                  title="Close Documentation"
                >
                  ×
                </motion.button>
              </div>
              <div className="space-y-4 text-gray-300">
                <section>
                  <h4 className="text-lg font-semibold">What are API Keys?</h4>
                  <p>
                    API Keys are unique identifiers used to authenticate requests associated with your account. They allow you to securely interact with the application&apos;s backend services.
                  </p>
                </section>
                <section>
                  <h4 className="text-lg font-semibold">How to Use API Keys</h4>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>
                      <strong>Authentication:</strong> Include your API Key in the request headers as <code>x-api-key</code>.
                    </li>
                    <li>
                      <strong>Accessing Protected Endpoints:</strong> Use the API Key to access endpoints that require authentication, such as uploading or fetching files.
                    </li>
                    <li>
                      <strong>Rate Limiting:</strong> Be mindful of the rate limits associated with your API Key to prevent throttling.
                    </li>
                  </ol>
                </section>
                <section>
                  <h4 className="text-lg font-semibold">Example Use Case</h4>
                  <p>
                    Here&apos;s how you can use your API Key to upload a file using <strong>cURL</strong>:
                  </p>
                  <pre className="bg-[#2a2a3a] p-4 rounded-lg overflow-x-auto">
                    <code>
                      {`curl -X POST http://103.15.157.253:3002/api/upload \\
  -H "x-api-key: YOUR_API_KEY" \\
  -F "files=@/path/to/your/file.jpg" \\
  -F "x-folder=your-folder-name"`}
                    </code>
                  </pre>
                </section>
                <section>
                  <h4 className="text-lg font-semibold">Best Practices</h4>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Keep your API Keys confidential. Do not share them publicly.</li>
                    <li>Regenerate your API Keys regularly to enhance security.</li>
                    <li>Use environment variables to store API Keys in your applications.</li>
                  </ul>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Keys List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {apiKeys.length === 0 ? (
          <p className="text-center text-gray-400">No API keys found. Generate one!</p>
        ) : (
          apiKeys.map((apiKey, index) => (
            <motion.div
              key={apiKey.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#2a2a3a] p-3 rounded-lg flex justify-between items-center backdrop-filter backdrop-blur-md bg-opacity-70"
            >
              <div>
                <code className="text-sm text-green-400 truncate block">
                  {apiKey.key}
                </code>
                <span className="text-xs text-gray-400">
                  Created at: {new Date(apiKey.createdAt).toLocaleString()}
                </span>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                onClick={() => copyToClipboard(apiKey.key)}
                className="text-blue-300 hover:text-blue-500 transition-colors"
                title="Copy API Key to Clipboard"
              >
                <Copy size={20} />
              </motion.button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ApiKeysSection;
