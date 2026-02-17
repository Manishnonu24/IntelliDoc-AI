import { useState, useEffect } from 'react'
import { Send, Bot, User, FileUp, Menu, MessageSquare, Plus, Settings, Download, Trash2, File } from 'lucide-react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'

function App() {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am IntelliDoc AI. How can I help you today?' }
    ])
    const [input, setInput] = useState('')
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isIngesting, setIsIngesting] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState([])

    useEffect(() => {
        fetchUploadedFiles()
    }, [])

    const fetchUploadedFiles = async () => {
        try {
            const response = await axios.get('/api/v1/files')
            setUploadedFiles(response.data.files)
        } catch (error) {
            console.error('Error fetching files:', error)
        }
    }

    const handleSendMessage = async () => {
        if (!input.trim()) return

        const userMessage = { role: 'user', content: input }
        setMessages(prev => [...prev, userMessage])
        setInput('')

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: input })
            })

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let assistantMessage = { role: 'assistant', content: '' }

            setMessages(prev => [...prev, assistantMessage])

            while (true) {
                const { value, done } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6))
                            if (data.content) {
                                assistantMessage.content += data.content
                                setMessages(prev => {
                                    const newMessages = [...prev]
                                    newMessages[newMessages.length - 1] = { ...assistantMessage }
                                    return newMessages
                                })
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data', e)
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error sending message:', error)
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }])
        }
    }

    const handleFileUpload = async (event) => {
        const file = event.target.files[0]
        if (!file) return

        setIsIngesting(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            await axios.post('/ingest', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            alert('File ingested successfully!')
            fetchUploadedFiles()
        } catch (error) {
            console.error('Error ingesting file:', error)
            alert('Failed to ingest file.')
        } finally {
            setIsIngesting(false)
        }
    }

    return (
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
            {/* Sidebar */}
            <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-gray-800 transition-all duration-300 flex flex-col border-r border-gray-700`}>
                <div className="p-4 flex items-center justify-between border-b border-gray-700">
                    <span className="font-bold text-lg flex items-center gap-2">
                        <Bot className="w-6 h-6 text-blue-400" />
                        IntelliDoc
                    </span>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 flex items-center gap-2 justify-center transition-colors">
                        <Plus className="w-4 h-4" />
                        New Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <div className="text-xs font-semibold text-gray-400 mb-2">Recent Chats</div>
                    <button className="w-full text-left p-2 hover:bg-gray-700 rounded text-sm flex items-center gap-2 text-gray-300 truncate">
                        <MessageSquare className="w-4 h-4" />
                        Project Analysis
                    </button>
                    
                    <div className="pt-4 border-t border-gray-700 mt-4">
                        <div className="text-xs font-semibold text-gray-400 mb-2">Uploaded Files ({uploadedFiles.length})</div>
                        <div className="space-y-1">
                            {uploadedFiles.length === 0 ? (
                                <div className="text-xs text-gray-500 p-2">No files uploaded yet</div>
                            ) : (
                                uploadedFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded text-xs text-gray-300 group">
                                        <File className="w-3 h-3 text-blue-400" />
                                        <span className="truncate flex-1 cursor-pointer" title={file.name}>{file.name}</span>
                                        <span className="text-gray-500 text-xs">{(file.size / 1024).toFixed(1)}KB</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer hover:text-blue-400 transition-colors">
                        <FileUp className="w-5 h-5" />
                        <input type="file" onChange={handleFileUpload} className="hidden" disabled={isIngesting} />
                        <span className="text-sm">{isIngesting ? 'Ingesting...' : 'Upload Document'}</span>
                    </label>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full bg-gray-900">
                {/* Header */}
                <div className="h-16 border-b border-gray-800 flex items-center px-4 justify-between">
                    <div className="flex items-center gap-4">
                        {!isSidebarOpen && (
                            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-400 hover:text-white">
                                <Menu className="w-6 h-6" />
                            </button>
                        )}
                        <h2 className="text-lg font-semibold">Chat Session</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-gray-400 hover:text-white">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-green-600'}`}>
                                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                </div>
                                <div className={`p-4 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-100'}`}>
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-800">
                    <div className="max-w-4xl mx-auto relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                            placeholder="Message IntelliDoc AI..."
                            className="w-full bg-gray-800 text-gray-100 rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-14"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim()}
                            className="absolute right-3 top-3 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="text-center text-xs text-gray-500 mt-2">
                        AI can make mistakes. Consider checking important information.
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App
