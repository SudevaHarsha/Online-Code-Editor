import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { motion } from "framer-motion";
import { useUser } from "../context/UserContext";
import { useFile } from "../context/UseFileContext";
import { useCodeEditorContext } from "../context/CodeEditorContext";
import { FaFileCode } from "react-icons/fa";
import { MdViewList, MdGridView } from "react-icons/md";
import { Download } from "lucide-react";

const languageExtensions = {
    javascript: "js",
    python: "py",
    java: "java",
    cpp: "cpp",
    c: "c",
    typescript: "ts",
    html: "html",
    css: "css",
    go: "go",
    ruby: "rb",
    rust: "rs",
    php: "php",
};

const FilesListPage = () => {
    const navigate = useNavigate();
    const [files, setFiles] = useState([]);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isBarsView, setIsBarsView] = useState(false);
    const [languageFilter, setLanguageFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState("newest");

    const auth = getAuth();
    const { user } = useUser();
    const { setTheme, setLanguage, theme } = useCodeEditorContext();
    const { setFile } = useFile();

    useEffect(() => {
        if (!user) {
            setLoading(false);
            navigate("/sign-in");
            return;
        }

        const fetchFiles = async () => {
            try {
                setLoading(true);
                const response = await fetch(`https://online-code-editor-dmo6.onrender.com/api/files/${user._id}`, {
                    method: "GET",
                    headers: { Authorization: `user?.token` },
                });

                if (!response.ok) throw new Error("Failed to fetch files");

                const data = await response.json();
                setFiles(data?.code || []);
            } catch (error) {
                console.error("Error fetching files:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFiles();
    }, [user, navigate]);

    useEffect(() => {
        let temp = [...files];

        if (languageFilter !== "all") {
            temp = temp.filter(file => file.language === languageFilter);
        }

        if (sortOrder === "newest") {
            temp.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        } else {
            temp.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
        }

        setFilteredFiles(temp);
    }, [languageFilter, sortOrder, files]);

    const handleFileClick = (file) => {
        setTheme(theme || "dark");
        setLanguage(file?.language);
        setFile(file);
        if (file?.code) localStorage.setItem(`editor-code-${file.language}`, file?.code);
        navigate(`/`, { state: { code: file.code } });
    };

    const formatDate = (timestamp) => {
        const date = typeof timestamp === "string" || typeof timestamp === "number"
            ? new Date(timestamp)
            : timestamp instanceof Date
                ? timestamp
                : null;

        if (!date || isNaN(date)) return "Invalid Date";

        return date.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };


    const handleDownload = (file) => {
        const blob = new Blob([file.code], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const extension = languageExtensions[file.language] || "txt";
        const link = document.createElement("a");
        link.href = url;
        link.download = `${file.fileName}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] text-gray-300 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-4xl font-bold text-white drop-shadow-lg">📁 Your Files</h2>
                <div className="flex gap-4 flex-wrap">
                    <select
                        value={languageFilter}
                        onChange={(e) => setLanguageFilter(e.target.value)}
                        className="bg-[#242424] text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none"
                    >
                        <option value="all">All Languages</option>
                        {[...new Set(files.map(file => file.language))].map(lang => (
                            <option key={lang} value={lang}>
                                {lang.toUpperCase()}
                            </option>
                        ))}
                    </select>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="bg-[#242424] text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                    <button
                        onClick={() => setIsBarsView(!isBarsView)}
                        className="flex items-center gap-2 bg-gray-800 px-4 py-2 text-white rounded-lg hover:bg-gray-700 transition"
                    >
                        {!isBarsView ? <MdGridView className="text-xl" /> : <MdViewList className="text-xl" />}
                        {!isBarsView ? "Cards View" : "Bars View"}
                    </button>
                </div>
            </div>

            {loading ? (
                <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <motion.div
                            key={index}
                            className="bg-[#242424] p-6 rounded-xl border border-gray-700 animate-pulse shadow-lg"
                        >
                            <div className="h-6 bg-gray-600 rounded w-3/4 mb-3"></div>
                            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                        </motion.div>
                    ))}
                </motion.div>
            ) : filteredFiles?.length === 0 ? (
                <motion.p className="text-gray-400 text-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                    No files match the selected filters.
                </motion.p>
            ) : isBarsView ? (
                <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {files.map((file, index) => (
                        <motion.div
                            key={index}
                            onClick={() => handleFileClick(file)}
                            className="cursor-pointer bg-[#1f1f1f] border border-[#2e2e2e] p-6 rounded-2xl shadow-md transition-transform duration-300 hover:scale-[1.02] hover:shadow-[0_0_10px_#3b82f680]"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.03 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <FaFileCode className="text-blue-500 text-2xl" />
                                <div className="flex items-center w-[100%] justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl font-semibold text-white">{file.fileName}</span>
                                    </div>
                                    <Download
                                        size={20}
                                        className="text-white hover:text-blue-400 cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(file);
                                        }}
                                    />
                                </div>

                            </div>
                            <p className="text-sm text-blue-400 font-mono tracking-wider">{file.language.toUpperCase()}</p>
                            <p className="text-xs text-gray-500 mt-2">📅 Created: {formatDate(file.updatedAt)}</p>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <motion.div className="flex flex-col gap-3">
                    {filteredFiles.map((file, index) => (
                        <motion.div
                            key={index}
                            onClick={() => handleFileClick(file)}
                            className="cursor-pointer w-full bg-[#1f1f1f] border border-[#2e2e2e] px-4 py-3 rounded-lg flex justify-between items-center transition hover:bg-[#292929] hover:border-[#3b82f680]"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.01 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex items-center gap-4">
                                <FaFileCode className="text-blue-500 text-xl" />
                                <p className="text-lg font-medium text-white">
                                    {file.fileName}.{languageExtensions[file.language] || file.language}
                                </p>
                            </div>
                            <div className="flex items-center justify-between w-[40%]">
                                <div className="flex items-center gap-3 text-sm text-gray-400 text-left w-[60%]">
                                    📅 {formatDate(file.updatedAt)} 
                                    </div>
                                <div className="text-blue-400 font-mono text-left text-sm w-[30%]">{file.language.toUpperCase()}</div>
                                <Download
                                    size={18}
                                    className="ml-2 text-white hover:text-blue-400 cursor-pointer w-[10%]"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(file);
                                    }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default FilesListPage;
