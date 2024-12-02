/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// /app/dashboard/page.tsx

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
  X,
  PlusCircle,
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { toast, Toaster } from 'sonner';
import axios from 'axios';
import { FaFileWord } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import ApiKeysSection from '@/components/ApiKeysSection';
import DocumentationSection from '@/components/DocumentationSection';
import { saveAs } from 'file-saver'; 
// Define the FileItem interface
interface FileItem {
  createdAt: string | number | Date;
  id: string;
  name: string;
  path: string;
  type: string;
  folder?: string;
}

// Helper function to generate share URL with proper format
const generateShareUrl = (token: string, frontendBaseUrl: string): string => {
  return `${frontendBaseUrl}/share/${token}`;
};

// Helper function to mask API keys for display
const maskApiKey = (key: string): string => {
  return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
};

// File type icon component
const FileTypeIcon: React.FC<{ fileType: string }> = ({ fileType }) => {
  const iconProps = { size: 24, className: 'text-blue-400' };

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
  const [apiKeys, setApiKeys] = useState<{ key: string; createdAt: string }[]>([]);
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

  // Function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to Clipboard', {
      description: 'Text is now in your clipboard',
    });
  };

  // Fetch API keys
  const fetchApiKeys = async () => {
    try {
      const response = await fetch(`/api/generate-api-key`, { method: 'GET' });
      const data = await response.json();

      if (response.ok) {
        setApiKeys(data.apiKeys);
      } else {
        toast.error('Failed to fetch API keys', {
          description: data.error || 'Could not retrieve API keys',
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Network Error', {
        description: 'Unable to connect to the server',
      });
    }
  };

  // Generate a new API key
  const generateApiKey = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/generate-api-key`, { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        // Prepend the new API key to the list
        setApiKeys((prev) => [{ key: data.apiKey, createdAt: new Date().toISOString() }, ...prev]);
        toast.success('API Key Generated', {
          description: 'Your new API key is ready to use!',
        });
      } else {
        toast.error('Generation Failed', {
          description: data.error || 'Could not generate API key',
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Network Error', {
        description: 'Unable to connect to the server',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Utility function to get the current API key (index 0)
  const getCurrentApiKey = (): string | null => {
    if (apiKeys.length === 0) {
      return null;
    }
    return apiKeys[0].key;
  };

  // Fetch files with selected API key
  const fetchFiles = async () => {
    const apiKey = getCurrentApiKey();

    if (!apiKey) {
      toast.error('API Key Missing', {
        description: 'Please generate an API key to access your files.',
      });
      return;
    }

    try {
      setIsLoading(true);
      const fetchUrl = `/api/files?folder=${encodeURIComponent(selectedFolder)}&page=1&limit=100`;
      const response = await axios.get(fetchUrl, {
        headers: {
          'x-api-key': apiKey, // Use dynamic API key
        },
      });

      if (response.status === 200) {
        setFiles(response.data.files || response.data);
      } else {
        toast.error('Failed to fetch files', {
          description: response.data.error || 'Could not retrieve your files',
        });
      }
    } catch (error: any) {
      console.error('File fetch error:', error);
      toast.error('Failed to fetch files', {
        description: error.response?.data?.error || 'Could not retrieve your files',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const apiKey = getCurrentApiKey();

    if (!apiKey) {
      toast.error('API Key Missing', {
        description: 'Please generate an API key to upload files.',
      });
      return;
    }

    const formData = new FormData();
    Array.from(uploadedFiles).forEach((file) => {
      formData.append('files', file);
    });
    formData.append('x-folder', selectedFolder);

    try {
      const uploadUrl = `/api/upload`;
      const response = await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-api-key': apiKey, // Use dynamic API key
        },
      });

      if (response.status === 200) {
        toast.success('Files Uploaded', {
          description: `${uploadedFiles.length} file(s) uploaded successfully`,
        });
        fetchFiles();
      } else {
        toast.error('Upload Failed', {
          description: response.data.error || 'Could not upload files',
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Upload Failed', {
        description: error.response?.data?.error || 'Could not upload files',
      });
    }
  };
  const handleDownloadFile = async (file: FileItem) => {
    const previewUrl = generatePreviewUrl(file.id);
    try {
      const response = await fetch(previewUrl);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      const blob = await response.blob();
      saveAs(blob, file.name);
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };
  // Handle file deletion
  const handleDeleteFile = async (fileId: string) => {
    const apiKey = getCurrentApiKey();

    if (!apiKey) {
      toast.error('API Key Missing', {
        description: 'Please generate an API key to delete files.',
      });
      return;
    }

    try {
      const deleteUrl = `/api/files/${fileId}`;
      const response = await axios.delete(deleteUrl, {
        headers: { 'x-api-key': apiKey }, // Use dynamic API key
      });

      if (response.status === 200) {
        toast.success('File Deleted', {
          description: 'File removed successfully',
        });
        fetchFiles();
      } else {
        toast.error('Deletion Failed', {
          description: response.data.error || 'Could not delete file',
        });
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Deletion Failed', {
        description: error.response?.data?.error || 'Could not delete file',
      });
    }
  };

  // Handle share link generation
  const generateShareLink = async () => {
    if (!fileToShare) return;

    const apiKey = getCurrentApiKey();

    if (!apiKey) {
      toast.error('API Key Missing', {
        description: 'Please generate an API key to share files.',
      });
      return;
    }

    try {
      const shareUrl = `/api/files/${fileToShare.id}/share`;
      const response = await axios.post(
        shareUrl,
        { expiresIn },
        {
          headers: {
            'x-api-key': apiKey, // Use dynamic API key
          },
        }
      );

      if (response.status === 201) {
        const { shareUrl: generatedShareUrl, expiresAt } = response.data;
        setShareLink(generatedShareUrl);

        toast.success('Share link generated successfully');
      } else {
        toast.error('Share Link Generation Failed', {
          description: response.data.error || 'Could not generate share link',
        });
      }
    } catch (error: any) {
      console.error('Share link generation error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate share link');
    }
  };

  // Handle file sharing
  const handleShareFile = (file: FileItem) => {
    setFileToShare(file);
    setExpiresIn(24); // Reset expiration time
    setShareLink('');
    setShareModalOpen(true);
  };

  // Handle file viewing
  const handleViewFile = (file: FileItem) => {
    setFileToPreview(file);
    setPreviewModalOpen(true);
  };

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
        description: message,
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
    return (
      <div className="text-center p-8">
        <FileTypeIcon fileType={file.type} />
        <p className="text-gray-300 my-4">Preview not available for {file.type}</p>
        <button
          onClick={() => handleDownloadFile(file)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Download File
        </button>
      </div>
    );
  };

  // Function to generate preview URL with API key as query parameter
  const generatePreviewUrl = (fileId: string): string => {
    const apiKey = getCurrentApiKey();
    if (!apiKey) return '';
  
    // Encode the API key to ensure it's URL-safe
    const encodedApiKey = encodeURIComponent(apiKey);
    return `/api/files/${fileId}/view?apiKey=${encodedApiKey}`;
  };

  // Create new folder
  const createNewFolder = () => {
    if (newFolderName.trim()) {
      setSelectedFolder(newFolderName.trim());
      setNewFolderName('');
      toast.success('Folder Created', {
        description: `Folder "${newFolderName}" is now active`,
      });
      fetchFiles();
    }
  };

  // Fetch API keys and files when dependencies change
  useEffect(() => {
    if (session?.user?.id) {
      fetchApiKeys();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Fetch files whenever API keys or selected folder changes
  useEffect(() => {
    if (apiKeys.length > 0) {
      fetchFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKeys, selectedFolder]);

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
              type: 'spring',
              stiffness: 260,
              damping: 20,
            }}
            whileHover={{
              scale: 1.1,
              rotate: 5,
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
                repeatType: 'reverse',
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

      {/* API Keys Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-[#1e1e2e] rounded-2xl p-6 space-y-4 backdrop-filter backdrop-blur-lg bg-opacity-60"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Shield className="text-blue-400" />
            <h2 className="text-2xl font-semibold">API Keys</h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={generateApiKey}
            className="bg-gradient-to-r from-green-600 to-emerald-600 
              px-4 py-2 rounded-full hover:from-green-700 hover:to-emerald-700 
              transition-all flex items-center space-x-2"
            disabled={isGenerating}
          >
            <PlusCircle size={20} />
            <span>Generate API Key</span>
          </motion.button>
        </div>

        {/* Instructions */}
        <div className="text-gray-300 text-sm">
          <p>Select an API key to authenticate your requests. You can generate multiple keys for different purposes.</p>
        </div>

        {/* Display API Keys */}
        <ApiKeysSection
          apiKeys={apiKeys}
          isLoading={isGenerating}
          generateApiKey={generateApiKey}
          copyToClipboard={copyToClipboard}
        />
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
                  transition-all flex items-center space-x-2"
              >
                <PlusCircle size={20} />
                <span>Create Folder</span>
              </motion.button>
            </div>
          </div>

          {/* File Input */}
          <div className="flex items-center space-x-4">
            <label className="flex-grow">
              <input type="file" multiple onChange={handleFileUpload} className="hidden" />
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
            {['default', ...new Set(files.map((f) => f.folder).filter(Boolean))].map((folder) => (
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
                title={`Select folder: ${folder}`}
              >
                {folder || 'default'}
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
                ease: 'linear',
              }}
            >
              <RefreshCw size={48} className="text-blue-400 animate-pulse" />
            </motion.div>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {files.filter((f) => f.folder === selectedFolder || (!f.folder && selectedFolder === 'default')).length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>No files in this folder</p>
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files
                  .filter((f) => f.folder === selectedFolder || (!f.folder && selectedFolder === 'default'))
                  .map((file, index) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: index * 0.1,
                        type: 'spring',
                        stiffness: 260,
                        damping: 20,
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
                  <h3 className="text-xl font-bold text-white truncate">{fileToPreview.name}</h3>
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
                    transition-all w-full flex items-center justify-center space-x-2"
                >
                  <Share2 size={20} />
                  <span>Generate Share Link</span>
                </motion.button>
                {shareLink && (
                  <div className="mt-4">
                    <p className="text-sm text-green-400 break-all">{shareLink}</p>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      onClick={() => copyToClipboard(shareLink)}
                      className="text-blue-300 hover:text-blue-500 transition-colors mt-2 flex items-center space-x-1"
                      title="Copy Share Link to Clipboard"
                    >
                      <Copy size={20} />
                      <span>Copy Link</span>
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Documentation Section */}
      <DocumentationSection />
    </div>
  );
};

export default DashboardPage;
