/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/dashboard.tsx
// or
// src/app/dashboard/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { 
  CloudUpload, 
  Copy, 
  Shield, 
  RefreshCw, 
  Folder, 
  File as FileIcon, 
  Trash2,
  Image as ImageIcon,
  File as DefaultFileIcon,
  FileText,
  Share2,
  X
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { toast, Toaster } from 'sonner';
import axios from 'axios';
import { FaFileWord } from "react-icons/fa";
import { useRouter } from 'next/navigation';
import ApiKeysSection from '@/components/ApiKeysSection';
import DocumentationSection from '@/components/DocumentationSection';

// Define the FileItem interface
interface FileItem {
  createdAt: string | number | Date;
  id: string;
  name: string;
  path: string;
  type: string;
  folder?: string;
}
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const FRONTEND_BASE_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin;
const ensureApiUrl = (url: string): string => {
  const cleanUrl = url.replace(/\/+$/, '');
  if (cleanUrl.includes('/api/')) {
    return cleanUrl;
  }
  if (cleanUrl.endsWith('/api')) {
    return `${cleanUrl}/`;
  }
  return cleanUrl.replace(/(https?:\/\/[^\/]+)\/?(.*)/, '$1/api/$2');
};

// Helper function to generate share URL with proper format
const generateShareUrl = (token: string): string => {
  return `${FRONTEND_BASE_URL}/api/share/${token}`;
};

const generatePreviewUrl = (fileId: string): string => {
  if (!API_BASE_URL) return '';
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  // Using /view endpoint instead of /preview since that's what was defined in the original code
  return `${ensureApiUrl(baseUrl)}/files/${fileId}/view`;
};

const generateFileViewUrl = (fileId: string): string => {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${baseUrl}/api/files/${fileId}/view`;
};
// Helper function to generate file download URL with proper format
const generateFileDownloadUrl = (fileId: string): string => {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${baseUrl}/api/files/${fileId}/download`;
};

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

// DashboardPage Component
const DashboardPage: React.FC = () => {
  const { data: session, status } = useSession();
  const [apiKeys, setApiKeys] = useState<{ key: string, createdAt: string }[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('default');

  // State variables for sharing and file preview
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [fileToShare, setFileToShare] = useState<FileItem | null>(null);
  const [expiresIn, setExpiresIn] = useState(24); // Default expiration time in hours
  const [shareLink, setShareLink] = useState('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [fileToPreview, setFileToPreview] = useState<FileItem | null>(null);

  const router = useRouter();

  // Access the API base URL from environment variables
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

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
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to Clipboard', {
      description: 'Text is now in your clipboard'
    });
  };
  // Copy text to clipboard
  const fetchFiles = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      const fetchUrl = ensureApiUrl(`${API_BASE_URL}/files`);
      const response = await axios.get(fetchUrl, {
        headers: { 
          'x-user-id': session.user.id 
        }
      });

      setFiles(response.data.files || response.data);
    } catch (error: any) {
      console.error('File fetch error:', error);
      toast.error('Failed to fetch files', {
        description: error.response?.data?.error || 'Could not retrieve your files'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Modified file upload function with consistent API URL
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const formData = new FormData();
    Array.from(uploadedFiles).forEach(file => {
      formData.append('files', file);
    });

    try {
      const uploadUrl = ensureApiUrl(`${API_BASE_URL}/upload`);
      const response = await axios.post(uploadUrl, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'x-user-id': session?.user?.id,
          'x-folder': selectedFolder
        }
      });

      toast.success('Files Uploaded', {
        description: `${uploadedFiles.length} file(s) uploaded successfully`
      });
      fetchFiles();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Upload Failed', {
        description: error.response?.data?.error || 'Could not upload files'
      });
    }
  };

  // Modified delete file function with consistent API URL
  const handleDeleteFile = async (fileId: string) => {
    try {
      const deleteUrl = ensureApiUrl(`${API_BASE_URL}/files/${fileId}`);
      await axios.delete(deleteUrl, {
        headers: { 'x-user-id': session?.user?.id }
      });

      toast.success('File Deleted', {
        description: 'File removed successfully'
      });
      fetchFiles();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Deletion Failed', {
        description: error.response?.data?.error || 'Could not delete file'
      });
    }
  };

  // Modified share link generation with consistent API URL
  const generateShareLink = async () => {
    if (!fileToShare) return;
    
    try {
      const shareUrl = ensureApiUrl(`${API_BASE_URL}/files/${fileToShare.id}/share`);
      const response = await axios.post(
        shareUrl,
        { expiresIn },
        {
          headers: {
            'x-user-id': session?.user?.id
          }
        }
      );
      
      // Extract token and generate proper share URL
      const shareToken = response.data.shareUrl.split('/').pop();
      const frontendShareUrl = generateShareUrl(shareToken);
      setShareLink(frontendShareUrl);
      
      toast.success('Share link generated successfully');
    } catch (error: any) {
      console.error('Share link generation error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate share link');
    }
  };

  const handleViewFile = async (file: FileItem) => {
    try {
      setFileToPreview(file);
      setPreviewModalOpen(true);
      
      // Optional: Verify file accessibility
      const previewUrl = generatePreviewUrl(file.id);
      const response = await fetch(previewUrl, {
        method: 'HEAD',
        headers: {
          'x-user-id': session?.user?.id || '',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Preview error:', error);
      toast.error('Preview Failed', {
        description: error.message || 'Unable to preview this file'
      });
      // Don't close the modal immediately, let user see the fallback view
    }
  };

  // Modified renderFilePreview function with better error handling
  const renderFilePreview = (file: FileItem) => {
    const previewUrl = generatePreviewUrl(file.id);
    
    if (!previewUrl) {
      return (
        <div className="text-center p-8">
          <p className="text-red-400">Error: Unable to generate preview URL</p>
        </div>
      );
    }

    const handlePreviewError = (message: string) => {
      toast.error('Preview Error', {
        description: message
      });
    };

    // Handle image files
    if (file.type.startsWith('image/')) {
      return (
        <div className="max-w-full max-h-full overflow-auto p-4">
          <img 
            src={previewUrl}
            alt={file.name}
            className="max-w-full h-auto object-contain rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              handlePreviewError('Failed to load image preview');
              target.src = '/placeholder-image.png';
            }}
          />
        </div>
      );
    }

    // Handle PDF files
    if (file.type === 'application/pdf') {
      return (
        <div className="w-full h-full p-4">
          <object
            data={previewUrl}
            type="application/pdf"
            className="w-full h-[calc(100vh-200px)] rounded-lg"
          >
            <div className="text-center p-8">
              <p className="text-gray-300 mb-4">PDF preview not available in your browser</p>
              <a
                href={previewUrl}
                download={file.name}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Download PDF
              </a>
            </div>
          </object>
        </div>
      );
    }

    // Handle text files
    if (file.type.startsWith('text/')) {
      return (
        <div className="w-full h-full p-4">
          <iframe
            src={previewUrl}
            title={file.name}
            className="w-full h-[calc(100vh-200px)] rounded-lg bg-white"
            sandbox="allow-same-origin allow-scripts"
            onError={() => handlePreviewError('Failed to load text preview')}
          />
        </div>
      );
    }

    // Default fallback for unsupported file types
    return (
      <div className="text-center p-8">
        <FileTypeIcon fileType={file.type} />
        <p className="text-gray-300 my-4">Preview not available for {file.type}</p>
        <a
          href={previewUrl}
          download={file.name}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Download File
        </a>
      </div>
    );
  };

  // Handle file sharing
  const handleShareFile = (file: FileItem) => {
    setFileToShare(file);
    setExpiresIn(24); // Reset expiration time
    setShareLink('');
    setShareModalOpen(true);
  };

  // Create new folder
  const createNewFolder = () => {
    if (newFolderName.trim()) {
      setSelectedFolder(newFolderName.trim());
      setNewFolderName('');
      toast.success('Folder Created', {
        description: `Folder "${newFolderName}" is now active`
      });
      fetchFiles();
    }
  };

  // Fetch files and API keys when dependencies change
  useEffect(() => {
    if (session?.user?.id) {
      fetchApiKeys();
      fetchFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, selectedFolder]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <RefreshCw size={48} className="animate-spin text-blue-400" />
      </div>
    );
  }

  if (!session) {
    router.replace('/login'); // or your login page route
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
              src="/logo-removebg-preview.png" // Ensure this image exists in the public directory
              alt="EmpireSphere Logo"
              width={120}
              height={120}
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
                onClick={() => {
                  setSelectedFolder(folder || 'default');
                  fetchFiles();
                }}
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
                        onClick={() => handleViewFile(file)}
                        className="text-blue-400 hover:text-blue-600"
                        title="View File"
                      >
                        <FileIcon size={20} />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleShareFile(file)}
                        className="text-green-400 hover:text-green-600"
                        title="Share File"
                      >
                        <Share2 size={20} />
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

      {/* Preview Modal */}
      <AnimatePresence>
      {previewModalOpen && fileToPreview && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-[#1e1e2e] rounded-lg p-6 w-11/12 h-5/6 md:w-4/5 lg:w-3/4 backdrop-filter backdrop-blur-lg bg-opacity-80 overflow-hidden"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <FileTypeIcon fileType={fileToPreview.type} />
                <h3 className="text-xl font-bold text-white truncate">
                  {fileToPreview.name}
                </h3>
              </div>
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setPreviewModalOpen(false);
                  setFileToPreview(null);
                }}
                className="text-red-500 hover:text-red-700"
                title="Close"
              >
                <X size={24} />
              </motion.button>
            </div>
            <div className="w-full h-[calc(100%-4rem)] overflow-auto">
              {renderFilePreview(fileToPreview)}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {shareModalOpen && (
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
                <h3 className="text-xl font-bold text-white">Share File</h3>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShareModalOpen(false)}
                  className="text-red-500 hover:text-red-700"
                  title="Close"
                >
                  <X size={24} />
                </motion.button>
              </div>
              <div className="space-y-4 text-gray-300">
                <p>Specify the expiration time (in hours) for the share link:</p>
                <input
                  type="number"
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(parseInt(e.target.value))}
                  min={1}
                  className="bg-[#2a2a3a] px-3 py-2 rounded-lg text-sm placeholder-gray-400 w-full"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={generateShareLink}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 
                    px-4 py-2 rounded-full hover:from-green-700 hover:to-emerald-700 
                    transition-all w-full"
                >
                  Generate Share Link
                </motion.button>
                {shareLink && (
                  <div className="mt-4">
                    <p className="text-sm text-green-400 break-all">{shareLink}</p>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      onClick={() => copyToClipboard(shareLink)}
                      className="text-blue-300 hover:text-blue-500 transition-colors mt-2"
                      title="Copy Share Link to Clipboard"
                    >
                      <Copy size={20} />
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Keys Section */}
      <ApiKeysSection
        apiKeys={apiKeys}
        isLoading={isGenerating}
        generateApiKey={generateApiKey}
        copyToClipboard={copyToClipboard}
      />

      {/* Documentation Section */}
      <DocumentationSection />
    </div>
  );
};

export default DashboardPage;
