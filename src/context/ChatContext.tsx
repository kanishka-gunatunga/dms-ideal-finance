'use client';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import {  getWithAuth } from '@/utils/apiClient';

export type ChatAction = 'summarize' | 'generate' | 'qa' | 'tone' | 'translate';

type ChatOptions = {
  chatId?: string;
  documentId?: string;
  documentName?: string;
  documentState?: string;
  action?: ChatAction;
};

type ChatState = {
  isOpen: boolean;
  chatId?: string;
  documentId?: string;
  documentName?: string;
  documentState?: string;
  action?: ChatAction;
  toggleChat: (options?: ChatOptions) => void;
  updateAction: (newAction: ChatAction) => void;
};

const ChatContext = createContext<ChatState | undefined>(undefined);

const uploadDocumentVectors = async (documentId: string) => {
  const res = await getWithAuth(`initialize-chat/${documentId}`);
  console.log("data upsert qa: ", res);
  return res;
};

const deleteDocumentVectors = async (chatId: string, action?: string) => {
  if (action === "qa") {
    const res = await getWithAuth(`delete-vectors/${chatId}`);
    console.log("data delete qa: ", res);
    return res;
  } else {
    // const res = await deleteWithAuth(`delete-nonqa/${chatId}`);
    console.log("data delete non-qa: ");
    // return res;
  }
};


export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [documentId, setDocumentId] = useState<string | undefined>();
  const [documentName, setDocumentName] = useState<string | undefined>();
  const [action, setAction] = useState<ChatAction | undefined>();
  const [chatId, setChatId] = useState<string | undefined>();
  const [documentState, setDocumentState] = useState<string | undefined>();

  // const toggleChat = async (options?: ChatOptions) => {
  //   if (!options) {
  //     if (chatId) {
  //       await deleteDocumentVectors(chatId, action);
  //     }
  //     setIsOpen(false);
  //     setChatId(undefined);
  //     setDocumentId(undefined);
  //     setDocumentName(undefined);
  //     setAction(undefined);
  //     return;
  //   }

  //   const newChatId = options.chatId ?? chatId ?? uuidv4();
  //   const newDocumentId = options.documentId;

  //   if (newDocumentId) {
  //     await uploadDocumentVectors(newDocumentId);
  //   }

  //   setChatId(newChatId);
  //   setDocumentId(newDocumentId);
  //   setDocumentName(options.documentName);
  //   setAction(options.action);
  //   setIsOpen(true);
  // };

  const toggleChat = async (options?: ChatOptions) => {
    if (!options) {
      if (chatId) {
        await deleteDocumentVectors(chatId, action);
      }
      setIsOpen(false);
      setChatId(undefined);
      setDocumentState(undefined)
      setDocumentId(undefined);
      setDocumentName(undefined);
      setAction(undefined);
      return;
    }
  
    let newChatId;
    let documentState;
    const newDocumentId = options.documentId;
  
    if (newDocumentId) {
      const res = await uploadDocumentVectors(newDocumentId);
      if (res?.chat_id) {
        newChatId = res.chat_id;
      }
      if (res?.status === "error") {
        documentState = res.message;
      }
    }
  
    setChatId(newChatId);
    setDocumentId(newDocumentId);
    setDocumentState(documentState)
    setDocumentName(options.documentName);
    setAction(options.action);
    setIsOpen(true);
  };
  

  const updateAction = (newAction: ChatAction) => {
    setAction(newAction);
  };

  useEffect(() => {
    const handleUnload = async () => {
      if (chatId) {
        await deleteDocumentVectors(chatId, action);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [chatId]);

  return (
    <ChatContext.Provider value={{ isOpen, toggleChat, chatId, documentId, documentName, documentState, action, updateAction }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatState => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
