// frontend/components/DocumentationSection.tsx

import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DocumentationSection: React.FC = () => {
  const [showDocumentation, setShowDocumentation] = useState(false);

  return (
    <div className="relative">
      {/* Documentation Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDocumentation(true)}
        className="flex items-center space-x-2 text-blue-400 hover:text-blue-600 transition-colors p-2 rounded-lg backdrop-filter backdrop-blur-md bg-opacity-30"
        title="View Documentation"
      >
        <Info size={20} />
        <span className="font-medium">Documentation</span>
      </motion.button>

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
              className="bg-[#1e1e2e] rounded-lg p-8 w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 backdrop-filter backdrop-blur-lg bg-opacity-80 overflow-y-auto max-h-screen"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Application Documentation</h3>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setShowDocumentation(false)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  title="Close Documentation"
                >
                  <X size={24} />
                </motion.button>
              </div>

              {/* Documentation Content */}
              <div className="space-y-6 text-gray-300">
                {/* Introduction */}
                <section>
                  <h4 className="text-xl font-semibold mb-2">Introduction</h4>
                  <p>
                    Welcome to the EmpireSphere Dashboard! This documentation will guide you through the various features of the application, including managing API Keys, uploading and organizing files, generating shareable links, and more.
                  </p>
                </section>

                {/* API Keys */}
                <section>
                  <h4 className="text-xl font-semibold mb-2">API Keys</h4>
                  <p>
                    API Keys are unique identifiers that allow you to authenticate requests to our backend services. They enable secure interactions with the application, such as uploading files, fetching data, and more.
                  </p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li><strong>Generate API Key:</strong> Click the &quot;Generate Key&quot; button to create a new API Key. Each key is prefixed with <code>emp_</code> and is unique to your account.</li>
                    <li><strong>Copy API Key:</strong> Use the copy icon next to each API Key to copy it to your clipboard.</li>
                    <li><strong>Expiration:</strong> You can set an expiration date for your API Keys when generating them.</li>
                    <li><strong>Best Practices:</strong> Keep your API Keys confidential. Do not share them publicly.</li>
                  </ul>
                </section>

                {/* File Management */}
                <section>
                  <h4 className="text-xl font-semibold mb-2">File Management</h4>
                  <p>
                    Our dashboard provides robust file management capabilities. You can upload, organize, and manage your files seamlessly. You can also generate shareable links for your files.
                  </p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li><strong>Upload Files:</strong> Use the &quot;File Upload&quot; section to select and upload multiple files at once.</li>
                    <li><strong>Create Folders:</strong> Organize your files by creating new folders. Enter a folder name and click &quot;Create Folder&quot; to activate it.</li>
                    <li><strong>View Files:</strong> Browse your uploaded files within the selected folder. Click the file icon to view or the trash icon to delete.</li>
                    <li><strong>Share Files:</strong> Generate shareable links for your files to share them with others. These links can have expiration dates for added security.</li>
                  </ul>
                </section>

                {/* Usage Examples */}
                <section>
                  <h4 className="text-xl font-semibold mb-2">Usage Examples</h4>
                  <p>
                    Here are some examples of how you can use your API Key to interact with the EmpireSphere API using <strong>cURL</strong>:
                  </p>

                  <p className="mt-4 font-semibold">Upload a File:</p>
                  <pre className="bg-[#2a2a3a] p-4 rounded-lg overflow-x-auto mt-2">
                    <code>
{`curl -X POST http://192.168.1.6:3003/api/upload \\
  -H "x-api-key: YOUR_API_KEY" \\
  -F "files=@/path/to/your/file.jpg" \\
  -H "x-folder: your-folder-name"`}
                    </code>
                  </pre>

                  <p className="mt-4 font-semibold">List Your Files:</p>
                  <pre className="bg-[#2a2a3a] p-4 rounded-lg overflow-x-auto mt-2">
                    <code>
{`curl -X GET "http://192.168.1.6:3003/api/files?page=1&limit=10" \\
  -H "x-api-key: YOUR_API_KEY"`}
                    </code>
                  </pre>

                  <p className="mt-4 font-semibold">Generate a Shareable Link for a File:</p>
                  <pre className="bg-[#2a2a3a] p-4 rounded-lg overflow-x-auto mt-2">
                    <code>
{`curl -X POST http://192.168.1.6:3003/api/files/YOUR_FILE_ID/share \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"expiresIn": 24}'`}
                    </code>
                  </pre>

                  <p className="text-sm text-gray-400">Replace <code>YOUR_FILE_ID</code> with the ID of the file you want to share. The <code>expiresIn</code> parameter sets the expiration time in hours.</p>
                </section>

                {/* Best Practices */}
                <section>
                  <h4 className="text-xl font-semibold mb-2">Best Practices</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Secure Storage:</strong> Store your API Keys securely using environment variables or secret managers.</li>
                    <li><strong>Regular Rotation:</strong> Regularly rotate your API Keys to enhance security.</li>
                    <li><strong>Monitor Usage:</strong> Keep an eye on the usage of your API Keys to detect any unusual activities.</li>
                    <li><strong>Set Expirations:</strong> Use expiration dates for API Keys and shareable links to limit exposure.</li>
                  </ul>
                </section>

                {/* Support */}
                <section>
                  <h4 className="text-xl font-semibold mb-2">Support</h4>
                  <p>
                    If you encounter any issues or have questions, please reach out to our support team at <a href="mailto:support@empiresphere.com" className="text-blue-400 underline">support@empiresphere.com</a>.
                  </p>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocumentationSection;
