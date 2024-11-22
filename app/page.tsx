/* eslint-disable react/jsx-no-undef */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import React, { useState, useEffect } from 'react';
import { 
  CloudUpload, 
  Key, 
  Copy, 
  Sparkles, 
  Shield, 
  RefreshCw, 
  Folder, 
  File as FileIcon, 
  Trash2,
  Image as ImageIcon,
  File as DefaultFileIcon,
  FileText
} from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { toast, Toaster } from 'sonner';
import axios from 'axios';
import { FaFileWord } from "react-icons/fa";
import { useRouter } from 'next/navigation';
import ApiKeysSection from '@/components/ApiKeysSection';
import DocumentationSection from '@/components/DocumentationSection';
 // Import the ApiKeysSection component

interface FileItem {
  createdAt: string | number | Date;
  id: string;
  name: string;
  path: string;
  type: string;
  folder?: string;
}

const FileTypeIcon: React.FC<{ fileType: string }> = ({ fileType }) => {
  const iconProps = { size: 24, className: "text-blue-400" };

  if (fileType.includes('image')) {
    return <ImageIcon {...iconProps} />;
  } else if (fileType === 'application/pdf') {
    return <FileText {...iconProps} />;
  } else if (
    fileType === 'application/msword' ||
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return <FaFileWord {...iconProps} />;
  } else if (fileType.includes('text')) {
    return <FileText {...iconProps} />;
  } else {
    return <DefaultFileIcon {...iconProps} />;
  }
};

const DashboardPage: React.FC = () => {
  const { data: session, status } = useSession();
  const [apiKeys, setApiKeys] = useState<{ key: string, createdAt: string }[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('default');

  // Access the API base URL from environment variables
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  const router = useRouter();

  // Fetch API keys
  const fetchApiKeys = async () => {
    try {
      const response = await fetch(`api/generate-api-key`, { method: 'GET' });
      const data = await response.json();

      if (response.ok) {
        setApiKeys(data.apiKeys);
      } else {
        toast.error('Failed to fetch API keys', {
          description: data.error || 'Could not retrieve API keys'
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Network Error', {
        description: 'Unable to connect to the server'
      });
    }
  };

  // Generate a new API key
  const generateApiKey = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`api/generate-api-key`, { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        // Prepend the new API key to the list
        setApiKeys(prev => [{ key: data.apiKey, createdAt: new Date().toISOString() }, ...prev]);
        toast.success('API Key Generated', {
          description: 'Your new API key is ready to use!'
        });
      } else {
        toast.error('Generation Failed', {
          description: data.error || 'Could not generate API key'
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Network Error', {
        description: 'Unable to connect to the server'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to Clipboard', {
      description: 'API key is now in your clipboard'
    });
  };

  // Fetch user files
  const fetchFiles = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/files`, {
        headers: { 
          'x-user-id': session.user.id 
        }
      });
      setFiles(response.data);
    } catch (error: any) {
      console.error(error);
      if (error.response && error.response.status === 401) {
        toast.error('Unauthorized', {
          description: 'Please log in to access your files.'
        });
      } else {
        toast.error('Failed to fetch files', {
          description: 'Could not retrieve your files'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const formData = new FormData();
    Array.from(uploadedFiles).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'x-user-id': session?.user?.id,
          'x-folder': selectedFolder
        }
      });

      toast.success('Files Uploaded', {
        description: `${uploadedFiles.length} file(s) uploaded successfully`
      });

      // Refresh files list
      fetchFiles();
    } catch (error: any) {
      console.error(error);
      if (error.response && error.response.data && error.response.data.error) {
        toast.error('Upload Failed', {
          description: error.response.data.error
        });
      } else {
        toast.error('Upload Failed', {
          description: 'Could not upload files'
        });
      }
    }
  };

  // Delete file
  const handleDeleteFile = async (fileId: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/files/${fileId}`, {
        headers: { 'x-user-id': session?.user?.id }
      });

      toast.success('File Deleted', {
        description: 'File removed successfully'
      });

      // Refresh files list
      fetchFiles();
    } catch (error: any) {
      console.error(error);
      if (error.response && error.response.data && error.response.data.error) {
        toast.error('Deletion Failed', {
          description: error.response.data.error
        });
      } else {
        toast.error('Deletion Failed', {
          description: 'Could not delete file'
        });
      }
    }
  };

  // View file
  const handleViewFile = (filePath: string) => {
    // Assuming uploads are served at `${API_BASE_URL.replace('/api', '')}/uploads/${filePath}`
    const uploadsBaseUrl = API_BASE_URL.replace('/api', '');
    window.open(`${uploadsBaseUrl}/uploads/${filePath}`, '_blank');
  };

  // Create new folder
  const createNewFolder = () => {
    if (newFolderName.trim()) {
      setSelectedFolder(newFolderName.trim());
      setNewFolderName('');
      toast.success('Folder Created', {
        description: `Folder "${newFolderName}" is now active`
      });
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchApiKeys();
      fetchFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <RefreshCw size={48} className="animate-spin text-blue-400" />
      </div>
    );
  }

  if (!session) {
    router.replace('/login'); // or whatever your login page route is
    return null; // Return null while redirecting
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a1a2a] to-[#0a0a1a] text-white p-8 space-y-8">
      <Toaster richColors />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex justify-between items-center"
      >
        <div className="flex items-center space-x-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20 
            }}
            whileHover={{ 
              scale: 1.1,
              rotate: 5 
            }}
            className="relative"
          >
            <Image
              src="/logo-removebg-preview.png" // Add your logo file
              alt="EmpireSphere Logo"
              width={70}
              height={70}
              className="rounded-lg"
            />
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-600 rounded-lg opacity-75 blur-sm -z-10"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          </motion.div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            EmpireSphere Dashboard
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <Shield className="text-blue-400" />
          <span>{session.user.username}</span>
        </div>
      </motion.div>

      {/* File Management Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="grid md:grid-cols-3 gap-6"
      >
        {/* File Upload Card */}
        <div className="bg-[#1e1e2e] rounded-2xl p-6 space-y-4 col-span-2 backdrop-filter backdrop-blur-lg bg-opacity-60">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <CloudUpload className="text-blue-400" />
              <h2 className="text-2xl font-semibold">File Upload</h2>
            </div>
            
            {/* Folder Creation */}
            <div className="flex items-center space-x-2">
              <input 
                type="text" 
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New Folder Name"
                className="bg-[#2a2a3a] px-3 py-2 rounded-lg text-sm placeholder-gray-400"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={createNewFolder}
                className="bg-gradient-to-r from-green-600 to-emerald-600 
                  px-4 py-2 rounded-full hover:from-green-700 hover:to-emerald-700 
                  transition-all"
              >
                Create Folder
              </motion.button>
            </div>
          </div>

          {/* File Input */}
          <div className="flex items-center space-x-4">
            <label className="flex-grow">
              <input 
                type="file" 
                multiple 
                onChange={handleFileUpload}
                className="hidden" 
              />
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-[#2a2a3a] p-4 rounded-lg border-2 border-dashed border-blue-600/50 
                  text-center cursor-pointer hover:border-blue-600 transition-all backdrop-filter backdrop-blur-md bg-opacity-70"
              >
                <div className="flex justify-center items-center space-x-2">
                  <CloudUpload className="text-blue-400" />
                  <span>Click to upload files to: {selectedFolder}</span>
                </div>
              </motion.div>
            </label>
          </div>
        </div>

        {/* Folders Card */}
        <div className="bg-[#1e1e2e] rounded-2xl p-6 space-y-4 backdrop-filter backdrop-blur-lg bg-opacity-60">
          <div className="flex items-center space-x-3">
            <Folder className="text-blue-400" />
            <h2 className="text-2xl font-semibold">Folders</h2>
          </div>
          <div className="space-y-2">
            {['default', ...new Set(files.map(f => f.folder).filter(Boolean))].map(folder => (
              <motion.div
                key={folder}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedFolder(folder || 'default')}
                className={`px-4 py-2 rounded-lg cursor-pointer transition-all 
                  ${selectedFolder === folder 
                    ? 'bg-blue-700/50' 
                    : 'bg-[#2a2a3a] hover:bg-[#3a3a4a]'
                  }`}
              >
                {folder}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Files List */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-[#1e1e2e] rounded-2xl p-6 space-y-4 backdrop-filter backdrop-blur-lg bg-opacity-60"
      >
        <div className="flex items-center space-x-3">
          <FileIcon className="text-blue-400" />
          <h2 className="text-2xl font-semibold">Files in {selectedFolder}</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5, 
                ease: "linear" 
              }}
            >
              <RefreshCw size={48} className="text-blue-400 animate-pulse" />
            </motion.div>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {files.filter(f => f.folder === selectedFolder || (!f.folder && selectedFolder === 'default')).length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>No files in this folder</p>
              </div>
            ) : (
              <motion.div 
                layout 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {files
                  .filter(f => f.folder === selectedFolder || (!f.folder && selectedFolder === 'default'))
                  .map((file, index) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 260,
                      damping: 20
                    }}
                    className="bg-[#2a2a3a] rounded-lg p-4 flex justify-between items-center space-x-4 
                      hover:bg-[#3a3a4a] transition-colors backdrop-filter backdrop-blur-md bg-opacity-70"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      {/* File type icon */}
                      <FileTypeIcon fileType={file.type} />
                      
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleViewFile(file.path)}
                        className="text-blue-400 hover:text-blue-600"
                        title="View File"
                      >
                        <FileIcon size={20} />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-red-400 hover:text-red-600"
                        title="Delete File"
                      >
                        <Trash2 size={20} />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </motion.div>

      {/* API Keys Section */}
      <ApiKeysSection
        apiKeys={apiKeys}
        isLoading={isGenerating}
        generateApiKey={generateApiKey}
        copyToClipboard={copyToClipboard}
      />
      <DocumentationSection />
    </div>
  );
};

export default DashboardPage;
