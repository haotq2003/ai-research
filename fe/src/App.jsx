import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  Compass,
  CheckCircle2,
  Database,
  Globe,
  BrainCircuit,
  FileText,
  Copy,
  ExternalLink,
  Printer,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ThumbsUp,
  AlertTriangle,
  Layers,
  ArrowRight,
  ListChecks,
  BookOpen,
  Check,
  Cpu,
  Download,
  History,
  Clock,
  Trash2,
  Plus,
  X,
  RotateCcw,
  User,
  LogIn,
  LogOut,
  Lock,
  Mail
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Sample demo data for instant UI review
const SAMPLE_DEMO_REPORT = {
  topic: 'Đánh giá kiến trúc Agentic RAG kết hợp pgvector trong Production',
  report: {
    topic: 'Đánh giá kiến trúc Agentic RAG kết hợp pgvector trong Production',
    executiveSummary: 'Kiến trúc Agentic RAG đại diện cho bước chuyển hóa mang tính bước ngoặt từ các luồng tìm kiếm ngữ nghĩa thụ động sang hệ thống đa tác tử tự hành (Multi-Agent System). Bằng cách kết hợp tiện ích mở rộng pgvector trên PostgreSQL sẵn có cùng mô hình lập kế hoạch lặp (iterative query planning), doanh nghiệp có thể giảm 42% tỷ lệ ảo giác (hallucination) đồng thời tối ưu hóa 60% chi phí vận hành hạ tầng so với việc duy trì các cụm Vector Database chuyên biệt độc lập.',
    keyFindings: [
      'Khả năng gom cụm ACID Transactional Data và Vector Embeddings trong cùng một cơ sở dữ liệu PostgreSQL giúp loại bỏ hoàn toàn bài toán phân mảnh dữ liệu (Data Fragmentation).',
      'Cơ chế Hybrid Search (kết hợp Full-text Search tsvector và pgvector cosine similarity <=>) mang lại độ chính xác cao hơn 18.4% so với tìm kiếm vector đơn thuần.',
      'Hiệu năng truy vấn với chỉ mục HNSW (Hierarchical Navigable Small World) trên pgvector 0.7+ đạt mốc < 4.2ms cho 1 triệu vector 768 chiều.',
      'Mô hình Agentic Workflow phân rã câu hỏi phức tạp thành 2-3 truy vấn con giúp bao quát đa chiều góc nhìn từ cộng đồng và số liệu kiểm chứng.'
    ],
    detailedAnalysis: [
      {
        pillar: 'Hợp nhất Hạ tầng Dữ liệu & Tính toàn vẹn ACID',
        content: 'Thay vì duy trì hai hệ thống tách rời (một RDBMS truyền thống và một Vector Database độc lập), việc tận dụng pgvector ngay trên PostgreSQL cho phép các truy vấn Vector Similarity diễn ra đồng thời với các mệnh đề WHERE, JOIN phức tạp trên bảng nghiệp vụ. Điều này giúp hệ thống duy trì tính nhất quán giao dịch và giảm thiểu rủi ro trễ đồng bộ (data synchronization lag).'
      },
      {
        pillar: 'Quy trình Multi-Agent Tự hành (Agentic Workflow)',
        content: 'Mô hình phân rã truy vấn (Query Decomposition) kết hợp luồng đánh giá phản hồi (Reflective Loop) giúp hệ thống không chỉ tìm kiếm một lần duy nhất mà có khả năng tự động đào sâu vào các khía cạnh còn thiếu. Khi RAG phát hiện dữ liệu chưa đủ độ tin cậy, tác tử có thể kích hoạt thêm truy vấn bổ sung để kiểm chứng chéo số liệu.'
      },
      {
        pillar: 'Tối ưu hóa Chi phí & Vận hành Production',
        content: 'So với mức phí bản quyền và chi phí duy trì cụm máy chủ chuyên dụng cho Pinecone hay Milvus, việc tích hợp pgvector vào cụm PostgreSQL hiện hữu giúp doanh nghiệp cắt giảm tới 60% chi phí hạ tầng. Đồng thời, đội ngũ kỹ thuật có thể tái sử dụng toàn bộ hệ thống sao lưu dự phòng (backup), giám sát (monitoring) và công cụ DevOps sẵn có.'
      }
    ],
    prosAndCons: {
      advantages: [
        'Tận dụng trọn vẹn hạ tầng PostgreSQL hiện có, giảm thiểu độ phức tạp DevOps và chi phí bản quyền.',
        'Hỗ trợ đầy đủ Row-Level Security (RLS) để phân quyền dữ liệu bảo mật ở cấp độ doanh nghiệp.',
        'Dễ dàng tích hợp các thư viện ORM quen thuộc như Prisma, Drizzle, pgvector/pg.',
        'Hỗ trợ truy vấn SQL kết hợp điều kiện lọc Metadata phức tạp cùng lúc với tìm kiếm độ tương đồng.'
      ],
      challenges: [
        'Cần tinh chỉnh thông số bộ nhớ (shared_buffers, maintenance_work_mem) cẩn trọng khi xây dựng chỉ mục HNSW quy mô lớn.',
        'Tốc độ Indexing khi chèn hàng loạt (Bulk Ingestion) chậm hơn một số Dedicated Vector DB thuần C++ như Milvus.',
        'Yêu cầu kỹ sư hiểu rõ cơ chế chunking kích thước tối ưu để tránh phân mảnh ngữ nghĩa quá vụn vặt.'
      ]
    },
    recommendations: [
      'Thiết lập chỉ mục HNSW với m = 16 và ef_construction = 64 để cân bằng tối ưu giữa tốc độ truy vấn và dung lượng RAM.',
      'Áp dụng chiến lược Hybrid Search (kết hợp tsvector BM25 và pgvector cosine) để bao quát cả từ khóa kỹ thuật chính xác lẫn ngữ nghĩa tự nhiên.',
      'Giới hạn kích thước chunk văn bản từ 500 - 800 ký tự với overlap 100 ký tự nhằm bảo toàn ngữ cảnh tốt nhất cho mô hình Embedding.'
    ],
    conclusion: 'Kiến trúc Agentic RAG với pgvector là lựa chọn chiến lược tối ưu nhất cho hơn 85% các doanh nghiệp muốn triển khai AI tạo sinh vào quy trình nghiệp vụ năm 2026. Sự hội tụ của dữ liệu quan hệ và dữ liệu vector trong một động cơ duy nhất giúp tối đa hóa độ tin cậy và kiểm soát an toàn thông tin.'
  },
  sources: [
    { title: 'PostgreSQL pgvector Documentation & Benchmarks', url: 'https://github.com/pgvector/pgvector' },
    { title: 'Agentic RAG Architecture Blueprint for Enterprise AI - LangChain Tech Blog', url: 'https://blog.langchain.dev' },
    { title: 'Deep Research System Design: Queues, Embeddings and Synthesis', url: 'https://arxiv.org' },
    { title: 'Postgres as a Vector Store: Performance, Indexing & Scaling at Scale', url: 'https://supabase.com/blog' }
  ]
};

const SUGGESTIONS = [
  'So sánh kiến trúc Microservices vs Monolith năm 2026',
  'Đánh giá hiệu năng DeepSeek V3 và GPT-4o',
  'Agentic RAG kết hợp pgvector trong Production',
  'WebAssembly và tương lai của Cloud Computing'
];

// Helper: Convert raw tech server logs into natural, friendly thoughts for end-users
function toFriendlyThought(rawMsg) {
  if (!rawMsg || typeof rawMsg !== 'string') return null;

  // Filter out noisy raw connection / producer logs
  if (rawMsg.includes('Đã kết nối luồng theo dõi phiên') || rawMsg.includes('Phiên điều tra đã được tạo thành công')) {
    return null;
  }

  if (rawMsg.includes('Đang gửi đề tài điều tra:')) {
    const cleanTopic = rawMsg.replace(/.*Đang gửi đề tài điều tra:\s*"?/, '').replace(/"?$/, '');
    return {
      title: 'Khởi động phiên nghiên cứu',
      sub: `Mục tiêu: "${cleanTopic}"`,
      type: 'start'
    };
  }

  if (rawMsg.includes('Đã lập kế hoạch gồm')) {
    return {
      title: 'Hoàn tất lập kế hoạch',
      sub: rawMsg,
      type: 'plan'
    };
  }

  if (rawMsg.includes('Đang tìm kiếm thông tin:')) {
    const query = rawMsg.replace(/.*Đang tìm kiếm thông tin:\s*"?/, '').replace(/"?$/, '');
    const stepMatch = rawMsg.match(/\[Bước (\d+\/\d+)\]/);
    const stepPrefix = stepMatch ? `[${stepMatch[1]}] ` : '';
    return {
      title: `${stepPrefix}Tìm kiếm tài liệu & số liệu`,
      sub: `Truy vấn: "${query}"`,
      type: 'search'
    };
  }

  if (rawMsg.includes('Đang tạo vector') || rawMsg.includes('đoạn văn bản vào pgvector')) {
    const countMatch = rawMsg.match(/lưu (\d+) đoạn văn bản/);
    const count = countMatch ? countMatch[1] : '';
    return {
      title: 'Chắt lọc dữ liệu trọng tâm',
      sub: count ? `Đã đọc hiểu và trích xuất ${count} đoạn dẫn chứng giá trị` : 'Trích xuất và phân loại các luận điểm quan trọng',
      type: 'extract'
    };
  }

  if (rawMsg.includes('Đang truy vấn các dẫn chứng')) {
    return {
      title: 'Đối chiếu & Xác thực dẫn chứng',
      sub: 'Lựa chọn các bằng chứng có độ liên quan và tính chuẩn xác cao nhất',
      type: 'verify'
    };
  }

  if (rawMsg.includes('Đang tổng hợp báo cáo chuyên sâu')) {
    return {
      title: 'Biên soạn báo cáo phân tích',
      sub: 'Mô hình AI đang tổng hợp các khía cạnh đa chiều thành tài liệu hoàn chỉnh',
      type: 'synthesize'
    };
  }

  if (rawMsg.includes('Nghiên cứu hoàn tất')) {
    return {
      title: 'Báo cáo đã sẵn sàng',
      sub: 'Đã hoàn thành toàn bộ quá trình nghiên cứu và tổng hợp',
      type: 'done'
    };
  }

  if (rawMsg.toLowerCase().includes('lỗi') || rawMsg.toLowerCase().includes('error') || rawMsg.toLowerCase().includes('thất bại')) {
    return {
      title: 'Gặp sự cố xử lý',
      sub: rawMsg,
      type: 'error'
    };
  }

  // Fallback friendly message
  return {
    title: 'Cập nhật tiến trình',
    sub: rawMsg,
    type: 'info'
  };
}

export default function App() {
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState('IDLE'); // IDLE, PENDING, IN_PROGRESS, COMPLETED, FAILED
  const [currentStep, setCurrentStep] = useState(null); // PLANNING, SEARCHING, EMBEDDING, RETRIEVAL, SYNTHESIS, DONE
  const [subQueries, setSubQueries] = useState([]);
  const [searchStepInfo, setSearchStepInfo] = useState({ step: 0, totalSteps: 0, query: '' });
  const [thoughts, setThoughts] = useState([]);
  const [rawLogs, setRawLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showRawLogs, setShowRawLogs] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Auth State
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('research_token') || null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('research_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({ email: '', password: '', fullName: '' });
  const [authError, setAuthError] = useState(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // History Drawer State
  const [historyList, setHistoryList] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [activeInvestigationId, setActiveInvestigationId] = useState(null);

  const eventSourceRef = useRef(null);
  const thoughtBodyRef = useRef(null);

  // Fetch History from Backend (chỉ tải khi đã đăng nhập)
  const fetchHistory = async () => {
    if (!authToken) {
      setHistoryList([]);
      return;
    }
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/research', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (res.ok) {
        const json = await res.json();
        setHistoryList(json.data || []);
      }
    } catch (err) {
      console.error('Lỗi tải lịch sử:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchHistory();
    } else {
      setHistoryList([]);
    }
  }, [authToken]);

  // Auth Submit Handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthSubmitting(true);

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : { email: authForm.email, password: authForm.password, fullName: authForm.fullName };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Không thể kết nối đến máy chủ Backend (Port 3000). Vui lòng đảm bảo Backend đang chạy.`);
      }

      const { token, user } = data.data;
      localStorage.setItem('research_token', token);
      localStorage.setItem('research_user', JSON.stringify(user));
      setAuthToken(token);
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      setAuthForm({ email: '', password: '', fullName: '' });
      showToast(authMode === 'login' ? `Chào mừng trở lại, ${user.fullName || user.email}!` : 'Đăng ký tài khoản thành công!');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('research_token');
    localStorage.removeItem('research_user');
    setAuthToken(null);
    setCurrentUser(null);
    setHistoryList([]);
    showToast('Đã đăng xuất tài khoản thành công!');
  };

  // Load a past investigation into view
  const loadInvestigationFromHistory = async (id) => {
    try {
      showToast('Đang tải dữ liệu phiên nghiên cứu...');
      const res = await fetch(`/api/research/${id}`);
      if (!res.ok) throw new Error('Không thể tải chi tiết');
      const json = await res.json();
      const item = json.data;

      setActiveInvestigationId(item.id);
      setTopic(item.topic);
      setErrorMsg(null);

      if (item.status === 'COMPLETED' && item.report_data) {
        setStatus('COMPLETED');
        setCurrentStep('DONE');
        setResult({
          investigationId: item.id,
          topic: item.topic,
          report: item.report_data,
          sources: item.sources || [],
        });
        setSubQueries([]);
        setThoughts([
          {
            title: 'Tải lại báo cáo từ cơ sở dữ liệu',
            sub: `Khởi tạo lúc ${new Date(item.created_at).toLocaleString('vi-VN')}`,
            type: 'done',
            time: new Date(item.created_at).toLocaleTimeString('vi-VN', { hour12: false })
          }
        ]);
        setIsHistoryOpen(false);
        showToast('Đã tải phiên nghiên cứu từ lịch sử!');
      } else if (item.status === 'IN_PROGRESS' || item.status === 'PENDING') {
        setStatus('IN_PROGRESS');
        setIsHistoryOpen(false);
        connectStream(item.id);
        showToast('Đang tiếp tục theo dõi phiên nghiên cứu này...');
      } else {
        setStatus(item.status || 'FAILED');
        setIsHistoryOpen(false);
        showToast('Phiên này đã thất bại hoặc không có báo cáo.');
      }
    } catch (err) {
      console.error('Lỗi tải phiên từ lịch sử:', err);
      showToast('Không thể tải phiên này: ' + err.message);
    }
  };

  // Delete an investigation
  const deleteInvestigationItem = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiên nghiên cứu này khỏi lịch sử?')) return;
    try {
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      const res = await fetch(`/api/research/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        setHistoryList((prev) => prev.filter((item) => item.id !== id));
        if (activeInvestigationId === id) {
          handleResetNew();
        }
        showToast('Đã xóa phiên nghiên cứu khỏi lịch sử!');
      }
    } catch (err) {
      showToast('Lỗi khi xóa: ' + err.message);
    }
  };

  // Reset to create a new research
  const handleResetNew = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setTopic('');
    setStatus('IDLE');
    setCurrentStep(null);
    setResult(null);
    setErrorMsg(null);
    setSubQueries([]);
    setSearchStepInfo({ step: 0, totalSteps: 0, query: '' });
    setThoughts([]);
    setRawLogs([]);
    setActiveInvestigationId(null);
    showToast('Sẵn sàng cho phiên nghiên cứu mới!');
  };

  // Scroll internally inside the thought stream box without moving user's page viewport
  useEffect(() => {
    if (thoughtBodyRef.current) {
      thoughtBodyRef.current.scrollTop = thoughtBodyRef.current.scrollHeight;
    }
  }, [thoughts]);

  // Clean up SSE stream on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const addActivityMessage = (rawMsg) => {
    const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    setRawLogs((prev) => [...prev, { time, msg: rawMsg }]);

    const friendly = toFriendlyThought(rawMsg);
    if (friendly) {
      setThoughts((prev) => [...prev, { ...friendly, time }]);
    }
  };

  // Calculate overall progress percentage
  const getOverallProgress = () => {
    if (status === 'COMPLETED' || currentStep === 'DONE') return 100;
    if (status === 'IDLE') return 0;
    if (currentStep === 'START' || currentStep === 'PLANNING') return 20;
    if (currentStep === 'PLANNING_DONE') return 35;
    if (currentStep === 'SEARCHING') {
      const step = searchStepInfo.step || 1;
      const total = searchStepInfo.totalSteps || 3;
      return Math.round(35 + (step / total) * 20); // 35 -> 55%
    }
    if (currentStep === 'EMBEDDING') {
      const step = searchStepInfo.step || 1;
      const total = searchStepInfo.totalSteps || 3;
      return Math.round(55 + (step / total) * 20); // 55 -> 75%
    }
    if (currentStep === 'RETRIEVAL') return 85;
    if (currentStep === 'SYNTHESIS') return 94;
    return 15;
  };

  // Start Real Research via Backend API
  const handleStartResearch = async (selectedTopic) => {
    const query = selectedTopic || topic;
    if (!query || !query.trim()) return;

    // Reset state
    setStatus('PENDING');
    setCurrentStep('START');
    setResult(null);
    setErrorMsg(null);
    setSubQueries([]);
    setSearchStepInfo({ step: 0, totalSteps: 0, query: '' });
    setThoughts([]);
    setRawLogs([]);

    addActivityMessage(`Đang gửi đề tài điều tra: "${query.trim()}"`);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      const res = await fetch('/api/research', {
        method: 'POST',
        headers,
        body: JSON.stringify({ topic: query.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const newId = data.investigationId;
      setActiveInvestigationId(newId);
      setStatus('IN_PROGRESS');
      fetchHistory();

      // Mở luồng SSE theo dõi tiến trình
      connectStream(newId);
    } catch (err) {
      console.error('Lỗi khởi chạy nghiên cứu:', err);
      setStatus('FAILED');
      setErrorMsg(err.message || 'Không thể kết nối đến máy chủ Backend');
      addActivityMessage(`Lỗi: ${err.message}`);
    }
  };

  // Fallback Polling: Kiểm tra kết quả từ DB nếu SSE bị proxy ngắt kết nối
  const pollCompletedResult = async (investigationId) => {
    try {
      const res = await fetch(`/api/research/${investigationId}`);
      if (!res.ok) return false;
      const json = await res.json();
      const item = json.data;
      if (item && item.status === 'COMPLETED' && item.report_data) {
        setCurrentStep('DONE');
        setStatus('COMPLETED');
        setResult({
          investigationId: item.id,
          topic: item.topic,
          report: item.report_data,
          sources: item.sources || [],
        });
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        fetchHistory();
        showToast('Nghiên cứu đã hoàn tất thành công!');
        return true;
      }
      if (item && item.status === 'FAILED') {
        setStatus('FAILED');
        setCurrentStep('FAILED');
        setErrorMsg('Phiên nghiên cứu đã thất bại');
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        return true;
      }
    } catch (e) {
      // ignore
    }
    return false;
  };

  // Connect to SSE stream
  const connectStream = (id) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sse = new EventSource(`/api/research/${id}/stream`);
    eventSourceRef.current = sse;

    sse.onmessage = (e) => {
      try {
        const eventData = JSON.parse(e.data);
        const { type, step, message, data, error } = eventData;

        if (message) {
          addActivityMessage(message);
        }

        if (type === 'CONNECTED') {
          // Connected
        } else if (type === 'PROGRESS') {
          setCurrentStep(step);
          if (step === 'PLANNING_DONE' && data?.subQueries) {
            setSubQueries(data.subQueries);
          }
          if (step === 'SEARCHING' && data) {
            setSearchStepInfo({
              step: data.step,
              totalSteps: data.totalSteps,
              query: data.query,
            });
          }
        } else if (type === 'RESULT') {
          setCurrentStep('DONE');
          setStatus('COMPLETED');
          setResult(data);
          sse.close();
          fetchHistory();
          showToast('Nghiên cứu đã hoàn tất thành công!');
        } else if (type === 'ERROR') {
          setStatus('FAILED');
          setCurrentStep('FAILED');
          setErrorMsg(error || message || 'Đã xảy ra sự cố trong quá trình phân tích');
          sse.close();
        }
      } catch (err) {
        console.error('Lỗi giải mã sự kiện SSE:', err);
      }
    };

    sse.onerror = async (err) => {
      console.warn('SSE stream bị gián đoạn, tự động đối chiếu dữ liệu hoàn tất từ Backend...');
      sse.close();
      
      // Kiểm tra ngay trong database
      const isFinished = await pollCompletedResult(id);
      if (!isFinished) {
        // Nếu Backend vẫn đang chạy, tiếp tục polling kiểm tra mỗi 3s
        let attempts = 0;
        const fallbackInterval = setInterval(async () => {
          attempts++;
          const done = await pollCompletedResult(id);
          if (done || attempts >= 40) {
            clearInterval(fallbackInterval);
          }
        }, 3000);
      }
    };
  };

  // Load interactive demo preview
  const handleLoadDemo = () => {
    setTopic(SAMPLE_DEMO_REPORT.topic);
    setStatus('COMPLETED');
    setCurrentStep('DONE');
    setResult(SAMPLE_DEMO_REPORT);
    setSubQueries([
      'So sánh hiệu năng pgvector vs chuyên biệt vector database trong production',
      'Đánh giá mô hình Agentic RAG và cơ chế Multi-Agent phân rã query',
      'Khả năng scale và chỉ mục HNSW trên PostgreSQL với pgvector'
    ]);
    setThoughts([
      { title: 'Khởi động phiên nghiên cứu', sub: `Mục tiêu: "${SAMPLE_DEMO_REPORT.topic}"`, type: 'start', time: '17:40:01' },
      { title: 'Hoàn tất lập kế hoạch', sub: 'Đã xác định 3 hướng nghiên cứu chuyên sâu', type: 'plan', time: '17:40:03' },
      { title: '[1/3] Tìm kiếm tài liệu & số liệu', sub: 'Truy vấn: "microservices vs monolith performance benchmarks 2026"', type: 'search', time: '17:40:05' },
      { title: 'Chắt lọc dữ liệu trọng tâm', sub: 'Đã đọc hiểu và trích xuất 8 đoạn dẫn chứng giá trị', type: 'extract', time: '17:40:07' },
      { title: '[2/3] Tìm kiếm tài liệu & số liệu', sub: 'Truy vấn: "real-world advantages and challenges in enterprise"', type: 'search', time: '17:40:10' },
      { title: 'Chắt lọc dữ liệu trọng tâm', sub: 'Đã đọc hiểu và trích xuất 8 đoạn dẫn chứng giá trị', type: 'extract', time: '17:40:12' },
      { title: '[3/3] Tìm kiếm tài liệu & số liệu', sub: 'Truy vấn: "modern architectural patterns and trends 2026"', type: 'search', time: '17:40:14' },
      { title: 'Đối chiếu & Xác thực dẫn chứng', sub: 'Lựa chọn các bằng chứng có độ liên quan và tính chuẩn xác cao nhất', type: 'verify', time: '17:40:17' },
      { title: 'Biên soạn báo cáo phân tích', sub: 'Mô hình AI đang tổng hợp các khía cạnh đa chiều thành tài liệu hoàn chỉnh', type: 'synthesize', time: '17:40:20' },
      { title: 'Báo cáo đã sẵn sàng', sub: 'Đã hoàn thành toàn bộ quá trình nghiên cứu và tổng hợp', type: 'done', time: '17:40:22' }
    ]);
    showToast('Đã nạp bản báo cáo mẫu để bạn review giao diện!');
  };

  // Copy Markdown
  const handleCopyMarkdown = () => {
    if (!result?.report) return;
    const { topic: repTopic, executiveSummary, keyFindings, detailedAnalysis, prosAndCons, recommendations, conclusion } = result.report;
    const md = `# BÁO CÁO NGHIÊN CỨU CHIẾN LƯỢC: ${repTopic}

## 1. Tóm Lược Điều Hành (Executive Summary)
${executiveSummary}

## 2. Các Luận Điểm Cốt Lõi (Key Findings)
${keyFindings?.map((k, i) => `${i + 1}. ${k}`).join('\n\n')}

${detailedAnalysis && detailedAnalysis.length > 0 ? `## 3. Phân Tích Chuyên Sâu Đa Chiều (Detailed Thematic Analysis)
${detailedAnalysis.map((d, i) => `### 3.${i + 1}. ${d.pillar}\n${d.content}`).join('\n\n')}
` : ''}
## 4. Ma Trận Đánh Giá Đa Chiều (Ưu & Nhược Điểm)
### Điểm Sáng, Tiềm Năng & Bài Học Rút Ra:
${prosAndCons?.advantages?.map((a) => `- ${a}`).join('\n')}

### Thách Thức, Rủi Ro & Điểm Nghẽn:
${prosAndCons?.challenges?.map((c) => `- ${c}`).join('\n')}

${recommendations && recommendations.length > 0 ? `## 5. Khuyến Nghị & Bài Học Chiến Lược
${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
` : ''}
## 6. Kết Luận Chiến Lược & Dự Báo Xu Hướng
${conclusion}

## 7. Nguồn Dẫn Chứng Đã Được Kiểm Chứng
${result.sources?.map((s) => `- [${s.title}](${s.url})`).join('\n')}
`;
    navigator.clipboard.writeText(md);
    showToast('Đã sao chép báo cáo dạng Markdown vào clipboard!');
  };

  // Direct PDF Export using jsPDF and html2canvas
  const handleExportPdf = async () => {
    if (!result?.report) return;
    setIsExportingPdf(true);
    showToast('Đang khởi tạo bản in PDF chất lượng cao...');

    try {
      const element = document.getElementById('printable-research-report');
      if (!element) throw new Error('Không tìm thấy nội dung báo cáo');

      // Create sharp canvas (scale 2 for retina crisp text)
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const margin = 10;
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - margin * 2);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - margin * 2);
      }

      // Generate clean Vietnamese file name
      const safeTitle = (result.report.topic || 'Bao-Cao-Nghien-Cuu')
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, '-');
      pdf.save(`${safeTitle}.pdf`);
      showToast('Đã xuất và tải xuống file PDF thành công!');
    } catch (err) {
      console.error('Lỗi xuất PDF:', err);
      showToast('Không thể tạo PDF tự động, chuyển sang hộp thoại In...');
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  const overallProgress = getOverallProgress();

  const filteredHistory = historyList.filter((item) => {
    if (!historySearchQuery.trim()) return true;
    return item.topic?.toLowerCase().includes(historySearchQuery.toLowerCase());
  });

  return (
    <div className="app-container">
      {/* Toast */}
      {toastMessage && (
        <div className="toast-notice">
          <Sparkles size={16} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="brand-wrapper">
          <div className="brand-icon-box">
            <Compass size={24} />
          </div>
          <div>
            <div className="brand-title">
              AI Research Investigator
              <span className="brand-badge">Trợ lý Nghiên cứu</span>
            </div>
            <div className="brand-tagline">
              Hệ thống tự động khảo sát đa nguồn, kiểm chứng dẫn chứng &amp; tổng hợp báo cáo chuyên sâu
            </div>
          </div>
        </div>

        <div className="header-status-group">
          {/* Nút Bắt Đầu Mới nếu đã có kết quả hoặc đang nghiên cứu */}
          {(status !== 'IDLE' || result) && (
            <button className="btn-secondary" onClick={handleResetNew} title="Tạo phiên nghiên cứu mới">
              <Plus size={14} color="#0284c7" />
              <span>Nghiên cứu mới</span>
            </button>
          )}

          {/* Nút Mở Drawer Lịch Sử */}
          <button
            className="btn-secondary"
            onClick={() => {
              setIsHistoryOpen(true);
              if (authToken) fetchHistory();
            }}
            title="Xem danh sách các phiên nghiên cứu trước đây"
          >
            <History size={14} color="#0284c7" />
            <span>Lịch sử {currentUser ? `(${historyList.length})` : ''}</span>
          </button>

          <button className="btn-secondary" onClick={handleLoadDemo}>
            <Sparkles size={14} color="#0284c7" />
            <span>Nạp bản mẫu Review</span>
          </button>

          {/* Đăng nhập / User Badge */}
          {currentUser ? (
            <div className="user-badge-wrapper" title={currentUser.email}>
              <div className="user-avatar-circle">
                {(currentUser.fullName || currentUser.email || 'U')[0].toUpperCase()}
              </div>
              <span style={{ fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.fullName || currentUser.email.split('@')[0]}
              </span>
              <button
                className="btn-delete-history"
                onClick={handleLogout}
                title="Đăng xuất tài khoản"
                style={{ marginLeft: 2 }}
              >
                <LogOut size={13} color="#ef4444" />
              </button>
            </div>
          ) : (
            <button
              className="btn-secondary"
              onClick={() => {
                setAuthError(null);
                setAuthMode('login');
                setIsAuthModalOpen(true);
              }}
              style={{ background: '#0284c7', color: '#ffffff', borderColor: '#0284c7' }}
            >
              <LogIn size={14} />
              <span>Đăng nhập</span>
            </button>
          )}
        </div>
      </header>

      {/* Hero Section & Search Bar */}
      <section className="hero-section">
        <h1 className="hero-headline">
          Khám phá tri thức chuyên sâu với{' '}
          <span className="hero-headline-gradient">Trí tuệ Nhân tạo Tự hành</span>
        </h1>
        <p className="hero-sub">
          Tự động hoạch định câu hỏi, tìm kiếm dữ liệu đa nguồn trên Internet,
          đối chiếu dẫn chứng và tổng hợp báo cáo phân tích toàn diện.
        </p>

        {/* Command Search Box */}
        <div className="search-command-card">
          <Search size={22} color="#0284c7" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Nhập bất kỳ đề tài công nghệ, xu hướng hoặc bài toán bạn muốn nghiên cứu..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleStartResearch();
            }}
          />
          <button
            className="search-action-btn"
            disabled={status === 'PENDING' || status === 'IN_PROGRESS' || !topic.trim()}
            onClick={() => handleStartResearch()}
          >
            {status === 'PENDING' || status === 'IN_PROGRESS' ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Đang nghiên cứu...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Bắt đầu Nghiên cứu</span>
              </>
            )}
          </button>
        </div>

        {/* Suggestion Pills */}
        <div className="topic-pills-row">
          <span className="topic-pill-label">Gợi ý đề tài phổ biến:</span>
          {SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              className="topic-pill"
              onClick={() => {
                setTopic(item);
                handleStartResearch(item);
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {/* Main Grid: Thought Pipeline on Left, Dossier Report on Right */}
      <main className="workspace-grid">
        {/* Left Column: Natural AI Thought Pipeline */}
        <aside className="glass-panel">
          <div className="panel-header">
            <div className="panel-title">
              <BrainCircuit size={18} color="#0284c7" />
              <span>Quá trình Nghiên cứu của AI</span>
            </div>

            <span
              className={`step-status-tag ${
                status === 'COMPLETED'
                  ? 'tag-done'
                  : status === 'IN_PROGRESS' || status === 'PENDING'
                  ? 'tag-active'
                  : 'tag-waiting'
              }`}
            >
              {status === 'COMPLETED'
                ? 'Đã hoàn thành'
                : status === 'IN_PROGRESS' || status === 'PENDING'
                ? 'Đang tiến hành'
                : 'Chờ lệnh'}
            </span>
          </div>

          <div className="panel-body">
            {/* Overall Progress Tracker */}
            <div className="progress-tracker-card">
              <div className="progress-header-row">
                <span className="progress-label-text">
                  <Cpu size={15} color="#0284c7" />
                  <span>Tiến độ tổng quan</span>
                </span>
                <span className="progress-percentage-pill">{overallProgress}%</span>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            {/* Natural Steps List */}
            <div className="pipeline-step-list">
              {/* Step 1 */}
              <div
                className={`pipeline-step-item ${
                  currentStep === 'PLANNING' ? 'is-active' : ''
                } ${['PLANNING_DONE', 'SEARCHING', 'EMBEDDING', 'RETRIEVAL', 'SYNTHESIS', 'DONE'].includes(currentStep) ? 'is-done' : ''}`}
              >
                <div className="step-icon-bubble">
                  {['PLANNING_DONE', 'SEARCHING', 'EMBEDDING', 'RETRIEVAL', 'SYNTHESIS', 'DONE'].includes(currentStep) ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <ListChecks size={17} />
                  )}
                </div>
                <div className="step-content-box">
                  <div className="step-header-line">
                    <span className="step-title">1. Xác định Mục tiêu &amp; Kế hoạch</span>
                    <span
                      className={`step-status-tag ${
                        currentStep === 'PLANNING'
                          ? 'tag-active'
                          : ['PLANNING_DONE', 'SEARCHING', 'EMBEDDING', 'RETRIEVAL', 'SYNTHESIS', 'DONE'].includes(currentStep)
                          ? 'tag-done'
                          : 'tag-waiting'
                      }`}
                    >
                      {currentStep === 'PLANNING'
                        ? 'Đang phân tích'
                        : ['PLANNING_DONE', 'SEARCHING', 'EMBEDDING', 'RETRIEVAL', 'SYNTHESIS', 'DONE'].includes(currentStep)
                        ? 'Hoàn tất'
                        : 'Chờ'}
                    </span>
                  </div>
                  <p className="step-desc">
                    Phân tích yêu cầu và thiết lập các hướng nghiên cứu trọng tâm.
                  </p>

                  {/* Render subqueries if available */}
                  {subQueries.length > 0 && (
                    <div className="subquery-pills-container">
                      {subQueries.map((q, idx) => (
                        <div key={idx} className="subquery-pill-item">
                          <ArrowRight size={13} color="#0284c7" style={{ marginTop: 2, flexShrink: 0 }} />
                          <span>{q}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2 */}
              <div
                className={`pipeline-step-item ${
                  currentStep === 'SEARCHING' ? 'is-active' : ''
                } ${['EMBEDDING', 'RETRIEVAL', 'SYNTHESIS', 'DONE'].includes(currentStep) ? 'is-done' : ''}`}
              >
                <div className="step-icon-bubble">
                  {['EMBEDDING', 'RETRIEVAL', 'SYNTHESIS', 'DONE'].includes(currentStep) ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Globe size={17} />
                  )}
                </div>
                <div className="step-content-box">
                  <div className="step-header-line">
                    <span className="step-title">2. Tìm kiếm &amp; Thu thập Tư liệu</span>
                    <span
                      className={`step-status-tag ${
                        currentStep === 'SEARCHING'
                          ? 'tag-active'
                          : ['EMBEDDING', 'RETRIEVAL', 'SYNTHESIS', 'DONE'].includes(currentStep)
                          ? 'tag-done'
                          : 'tag-waiting'
                      }`}
                    >
                      {currentStep === 'SEARCHING'
                        ? `Bước ${searchStepInfo.step}/${searchStepInfo.totalSteps || 3}`
                        : ['EMBEDDING', 'RETRIEVAL', 'SYNTHESIS', 'DONE'].includes(currentStep)
                        ? 'Đã thu thập'
                        : 'Chờ'}
                    </span>
                  </div>
                  <p className="step-desc">
                    Khảo sát các dữ liệu thực tế và tài liệu đối chiếu trên Internet.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div
                className={`pipeline-step-item ${
                  currentStep === 'EMBEDDING' ? 'is-active' : ''
                } ${['RETRIEVAL', 'SYNTHESIS', 'DONE'].includes(currentStep) ? 'is-done' : ''}`}
              >
                <div className="step-icon-bubble">
                  {['RETRIEVAL', 'SYNTHESIS', 'DONE'].includes(currentStep) ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <BookOpen size={17} />
                  )}
                </div>
                <div className="step-content-box">
                  <div className="step-header-line">
                    <span className="step-title">3. Chắt lọc &amp; Trích xuất Tri thức</span>
                    <span
                      className={`step-status-tag ${
                        currentStep === 'EMBEDDING'
                          ? 'tag-active'
                          : ['RETRIEVAL', 'SYNTHESIS', 'DONE'].includes(currentStep)
                          ? 'tag-done'
                          : 'tag-waiting'
                      }`}
                    >
                      {currentStep === 'EMBEDDING'
                        ? 'Đang xử lý'
                        : ['RETRIEVAL', 'SYNTHESIS', 'DONE'].includes(currentStep)
                        ? 'Đã trích xuất'
                        : 'Chờ'}
                    </span>
                  </div>
                  <p className="step-desc">
                    Đọc hiểu nội dung và phân loại các luận điểm có giá trị kiểm chứng.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div
                className={`pipeline-step-item ${
                  currentStep === 'RETRIEVAL' ? 'is-active' : ''
                } ${['SYNTHESIS', 'DONE'].includes(currentStep) ? 'is-done' : ''}`}
              >
                <div className="step-icon-bubble">
                  {['SYNTHESIS', 'DONE'].includes(currentStep) ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Compass size={17} />
                  )}
                </div>
                <div className="step-content-box">
                  <div className="step-header-line">
                    <span className="step-title">4. Đối chiếu &amp; Xác thực Dẫn chứng</span>
                    <span
                      className={`step-status-tag ${
                        currentStep === 'RETRIEVAL'
                          ? 'tag-active'
                          : ['SYNTHESIS', 'DONE'].includes(currentStep)
                          ? 'tag-done'
                          : 'tag-waiting'
                      }`}
                    >
                      {currentStep === 'RETRIEVAL'
                        ? 'Đang đối chiếu'
                        : ['SYNTHESIS', 'DONE'].includes(currentStep)
                        ? 'Đã xác thực'
                        : 'Chờ'}
                    </span>
                  </div>
                  <p className="step-desc">
                    Sàng lọc các bằng chứng khách quan và sát thực nhất với đề tài.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div
                className={`pipeline-step-item ${
                  currentStep === 'SYNTHESIS' ? 'is-active' : ''
                } ${currentStep === 'DONE' ? 'is-done' : ''}`}
              >
                <div className="step-icon-bubble">
                  {currentStep === 'DONE' ? <CheckCircle2 size={18} /> : <FileText size={17} />}
                </div>
                <div className="step-content-box">
                  <div className="step-header-line">
                    <span className="step-title">5. Biên soạn Báo cáo Chiến lược</span>
                    <span
                      className={`step-status-tag ${
                        currentStep === 'SYNTHESIS'
                          ? 'tag-active'
                          : currentStep === 'DONE'
                          ? 'tag-done'
                          : 'tag-waiting'
                      }`}
                    >
                      {currentStep === 'SYNTHESIS'
                        ? 'Đang soạn thảo'
                        : currentStep === 'DONE'
                        ? 'Sẵn sàng'
                        : 'Chờ'}
                    </span>
                  </div>
                  <p className="step-desc">
                    Tổng hợp toàn diện các phát hiện, ưu - nhược điểm và kết luận xu hướng.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Thought Stream / Friendly Activity Feed */}
            <div className="thought-stream-card">
              <div className="thought-stream-header">
                <div className="thought-stream-title">
                  <Sparkles size={14} color="#0284c7" />
                  <span>Nhật ký Hoạt động</span>
                </div>

                {rawLogs.length > 0 && (
                  <button
                    className="raw-log-toggle"
                    onClick={() => setShowRawLogs(!showRawLogs)}
                    title="Chuyển đổi nhật ký kỹ thuật"
                  >
                    <span>{showRawLogs ? 'Thu gọn' : 'Log kỹ thuật'}</span>
                    {showRawLogs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}
              </div>

              {showRawLogs && (
                <div className="raw-log-drawer">
                  {rawLogs.map((item, idx) => (
                    <div key={idx}>[{item.time}] {item.msg}</div>
                  ))}
                </div>
              )}

              <div ref={thoughtBodyRef} className="thought-stream-body">
                {thoughts.length === 0 ? (
                  <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem', padding: '10px 0', textAlign: 'center' }}>
                    Sẵn sàng tiếp nhận yêu cầu nghiên cứu mới...
                  </div>
                ) : (
                  thoughts.map((item, i) => (
                    <div
                      key={i}
                      className={`thought-item ${item.type === 'done' ? 'is-done' : item.type === 'error' ? 'is-error' : ''}`}
                    >
                      <div className="thought-item-icon">
                        {item.type === 'done' ? (
                          <Check size={14} />
                        ) : item.type === 'search' ? (
                          <Search size={13} />
                        ) : item.type === 'extract' ? (
                          <BookOpen size={13} />
                        ) : item.type === 'plan' ? (
                          <ListChecks size={13} />
                        ) : (
                          <Sparkles size={13} />
                        )}
                      </div>
                      <div className="thought-item-content">
                        <div className="thought-item-text">{item.title}</div>
                        {item.sub && <div className="thought-item-sub">{item.sub}</div>}
                      </div>
                      <span className="thought-item-time">{item.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Research Dossier / Report */}
        <section className="glass-panel">
          {result?.report ? (
            <div>
              {/* Report Header Toolbar */}
              <div className="report-header-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="report-title-badge">
                    <CheckCircle2 size={14} />
                    Báo Cáo Nghiên Cứu Chính Thức
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {new Date().toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-secondary" onClick={handleCopyMarkdown} title="Sao chép Markdown">
                    <Copy size={14} />
                    <span>Sao chép Markdown</span>
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                    title="Tải xuống tài liệu PDF trực tiếp"
                  >
                    {isExportingPdf ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} color="#0284c7" />
                    )}
                    <span>{isExportingPdf ? 'Đang tạo PDF...' : 'Xuất PDF'}</span>
                  </button>
                  <button className="btn-secondary" onClick={handlePrint} title="In hoặc lưu PDF">
                    <Printer size={14} />
                    <span>In</span>
                  </button>
                </div>
              </div>

              {/* Report Content Body */}
              <div id="printable-research-report" className="panel-body">
                {/* Topic Title */}
                <h2
                  style={{
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    marginBottom: 20,
                    lineHeight: 1.35,
                  }}
                >
                  {result.report.topic}
                </h2>

                {/* 1. Executive Summary */}
                <div className="report-section-block">
                  <div className="section-label">
                    <Sparkles size={16} color="#0284c7" />
                    <span>1. Tóm Lược Điều Hành (Executive Summary)</span>
                  </div>
                  <div className="summary-card">
                    {result.report.executiveSummary}
                  </div>
                </div>

                {/* 2. Key Findings */}
                <div className="report-section-block">
                  <div className="section-label">
                    <Compass size={16} color="#0d9488" />
                    <span>2. Các Luận Điểm Cốt Lõi (Key Findings)</span>
                  </div>
                  <div className="findings-list">
                    {result.report.keyFindings?.map((finding, idx) => (
                      <div key={idx} className="finding-card">
                        <div className="finding-bullet-icon">
                          <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{idx + 1}</span>
                        </div>
                        <div>{finding}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Detailed Thematic Analysis */}
                {result.report.detailedAnalysis && result.report.detailedAnalysis.length > 0 && (
                  <div className="report-section-block">
                    <div className="section-label">
                      <BrainCircuit size={16} color="#0284c7" />
                      <span>3. Phân Tích Chuyên Sâu Đa Chiều (Thematic Analysis)</span>
                    </div>
                    <div className="detailed-analysis-grid">
                      {result.report.detailedAnalysis.map((item, idx) => (
                        <div key={idx} className="analysis-pillar-card">
                          <div className="pillar-header">
                            <span className="pillar-number">Trụ cột {idx + 1}</span>
                            <h4 className="pillar-title">{item.pillar}</h4>
                          </div>
                          <div className="pillar-content">{item.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Pros & Cons Matrix */}
                <div className="report-section-block">
                  <div className="section-label">
                    <Layers size={16} color="#059669" />
                    <span>4. Ma Trận Đánh Giá Đa Chiều (Ưu &amp; Nhược Điểm)</span>
                  </div>
                  <div className="comparison-grid">
                    {/* Advantages */}
                    <div className="pro-box">
                      <div className="box-title">
                        <ThumbsUp size={16} />
                        <span>Điểm Sáng, Tiềm Năng &amp; Bài Học Rút Ra</span>
                      </div>
                      <ul className="box-list">
                        {result.report.prosAndCons?.advantages?.map((adv, idx) => (
                          <li key={idx}>
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
                            <span>{adv}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Challenges */}
                    <div className="con-box">
                      <div className="box-title">
                        <AlertTriangle size={16} />
                        <span>Thách Thức, Rủi Ro &amp; Điểm Nghẽn</span>
                      </div>
                      <ul className="box-list">
                        {result.report.prosAndCons?.challenges?.map((chal, idx) => (
                          <li key={idx}>
                            <span style={{ color: '#f43f5e', fontWeight: 'bold' }}>✕</span>
                            <span>{chal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 5. Strategic Recommendations */}
                {result.report.recommendations && result.report.recommendations.length > 0 && (
                  <div className="report-section-block">
                    <div className="section-label">
                      <ListChecks size={16} color="#0d9488" />
                      <span>5. Khuyến Nghị &amp; Bài Học Chiến Lược</span>
                    </div>
                    <div className="recommendations-list">
                      {result.report.recommendations.map((rec, idx) => (
                        <div key={idx} className="recommendation-item">
                          <div className="rec-icon">
                            <CheckCircle2 size={16} color="#0d9488" />
                          </div>
                          <div className="rec-text">{rec}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Strategic Conclusion */}
                <div className="report-section-block">
                  <div className="section-label">
                    <CheckCircle2 size={16} color="#0284c7" />
                    <span>6. Kết Luận Chiến Lược &amp; Xu Hướng Tương Lai</span>
                  </div>
                  <div className="conclusion-card">
                    <p>{result.report.conclusion}</p>
                  </div>
                </div>

                {/* 7. Verified Sources */}
                {result.sources && result.sources.length > 0 && (
                  <div className="report-section-block" style={{ marginBottom: 0 }}>
                    <div className="section-label">
                      <Globe size={16} color="#64748b" />
                      <span>7. Nguồn Dẫn Chứng Đã Được Kiểm Tra ({result.sources.length} Nguồn Trực Tiếp)</span>
                    </div>
                    <div className="sources-grid">
                      {result.sources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="source-item-card"
                        >
                          <div className="source-item-title">{src.title}</div>
                          <div className="source-item-url">
                            <ExternalLink size={12} />
                            <span>{src.url}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="report-empty-state">
              <div className="empty-icon-ring">
                {status === 'IN_PROGRESS' || status === 'PENDING' ? (
                  <RefreshCw size={28} className="animate-spin" />
                ) : (
                  <FileText size={28} />
                )}
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                  {status === 'IN_PROGRESS' || status === 'PENDING'
                    ? 'AI đang tổng hợp và phân tích dữ liệu...'
                    : 'Chưa có bản báo cáo nào'}
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: 460, margin: '0 auto' }}>
                  {status === 'IN_PROGRESS' || status === 'PENDING'
                    ? 'Quá trình thường mất khoảng 20 - 40 giây để khảo sát đa nguồn, đối chiếu dữ liệu và biên soạn báo cáo chuẩn xác.'
                    : 'Hãy nhập một đề tài ở thanh tìm kiếm phía trên hoặc nhấn "Nạp bản mẫu Review" ở góc phải để xem trước cấu trúc báo cáo.'}
                </p>
              </div>

              {status === 'IDLE' && (
                <button className="btn-secondary" onClick={handleLoadDemo} style={{ marginTop: 10 }}>
                  <Sparkles size={15} color="#0284c7" />
                  <span>Xem Bản Báo Cáo Mẫu</span>
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Slide-over History Drawer */}
      {isHistoryOpen && (
        <>
          <div className="history-drawer-overlay" onClick={() => setIsHistoryOpen(false)} />
          <aside className="history-drawer">
            {/* Header */}
            <div className="history-drawer-header">
              <div className="history-drawer-title-group">
                <History size={20} color="#0284c7" />
                <h3 className="history-drawer-title">Lịch Sử Nghiên Cứu</h3>
                <span className="history-count-badge">{filteredHistory.length} phiên</span>
              </div>
              <button 
                className="btn-icon-close" 
                onClick={() => setIsHistoryOpen(false)}
                title="Đóng lịch sử"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search filter within history */}
            <div className="history-search-container">
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                className="history-search-input"
                placeholder="Tìm kiếm trong lịch sử..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
              />
              {historySearchQuery && (
                <button
                  className="btn-icon-close"
                  onClick={() => setHistorySearchQuery('')}
                  style={{ padding: 2 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* List */}
            <div className="history-list-content">
              {!currentUser ? (
                <div className="history-guest-card">
                  <div className="history-empty-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                    <Sparkles size={24} />
                  </div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
                    Đăng nhập để xem Lịch sử
                  </h4>
                  <p style={{ margin: '0 0 18px 0', fontSize: '0.84rem', color: '#64748b', lineHeight: 1.55 }}>
                    Các phiên nghiên cứu chuyên sâu của bạn sẽ được lưu trữ và đồng bộ hóa an toàn khi bạn đăng nhập tài khoản.
                  </p>
                  <button
                    className="auth-submit-btn"
                    onClick={() => {
                      setAuthError(null);
                      setAuthMode('login');
                      setIsAuthModalOpen(true);
                    }}
                    style={{ width: '100%', fontSize: '0.85rem', padding: '9px 16px' }}
                  >
                    <LogIn size={15} />
                    <span>Đăng nhập hoặc Tạo tài khoản</span>
                  </button>
                </div>
              ) : isLoadingHistory ? (
                <div className="history-empty-state">
                  <RefreshCw size={24} className="animate-spin" color="#0284c7" />
                  <p style={{ marginTop: 12, fontSize: '0.85rem' }}>Đang nạp danh sách lịch sử...</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="history-empty-state">
                  <div className="history-empty-icon">
                    <Clock size={24} />
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#1e293b' }}>
                    {historySearchQuery ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có lịch sử nghiên cứu'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                    {historySearchQuery
                      ? 'Thử thay đổi từ khóa tìm kiếm'
                      : 'Khi bạn thực hiện nghiên cứu, các phiên sẽ tự động được lưu lại tại đây.'}
                  </p>
                </div>
              ) : (
                filteredHistory.map((item) => {
                  const isCurrentActive = activeInvestigationId === item.id;
                  const dateStr = item.created_at
                    ? new Date(item.created_at).toLocaleString('vi-VN', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                    : '';

                  return (
                    <div
                      key={item.id}
                      className={`history-item-card ${isCurrentActive ? 'active' : ''}`}
                      onClick={() => loadInvestigationFromHistory(item.id)}
                    >
                      <div className="history-item-header">
                        <h4 className="history-item-topic" title={item.topic}>
                          {item.topic}
                        </h4>
                        <div className="history-item-actions">
                          <button
                            className="btn-delete-history"
                            onClick={(e) => deleteInvestigationItem(e, item.id)}
                            title="Xóa phiên này"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="history-item-footer">
                        <span className="history-item-time">
                          <Clock size={12} />
                          <span>{dateStr}</span>
                        </span>

                        <span
                          className={`history-status-badge ${
                            item.status === 'COMPLETED'
                              ? 'badge-status-completed'
                              : item.status === 'IN_PROGRESS' || item.status === 'PENDING'
                              ? 'badge-status-inprogress'
                              : 'badge-status-failed'
                          }`}
                        >
                          {item.status === 'COMPLETED' ? (
                            <>
                              <CheckCircle2 size={11} />
                              <span>Hoàn tất</span>
                            </>
                          ) : item.status === 'IN_PROGRESS' || item.status === 'PENDING' ? (
                            <>
                              <RefreshCw size={11} className="animate-spin" />
                              <span>Đang chạy</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={11} />
                              <span>Lỗi</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="history-drawer-footer">
              <button
                className="btn-secondary"
                onClick={fetchHistory}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                disabled={!currentUser}
              >
                <RotateCcw size={13} />
                <span>Làm mới</span>
              </button>
              <button
                className="btn-secondary"
                onClick={() => setIsHistoryOpen(false)}
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                <span>Đóng</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Auth Modal (Login / Register) */}
      {isAuthModalOpen && (
        <div className="auth-modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal-header">
              <button
                className="auth-modal-close-btn"
                onClick={() => setIsAuthModalOpen(false)}
              >
                <X size={18} />
              </button>
              <div style={{ display: 'inline-flex', padding: 8, borderRadius: 12, background: '#e0f2fe', color: '#0284c7', marginBottom: 8 }}>
                <Compass size={24} />
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', color: '#0f172a' }}>
                AI Research Investigator
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                Đăng nhập để đồng bộ và lưu trữ lịch sử nghiên cứu
              </p>
            </div>

            <div className="auth-tabs">
              <button
                className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                }}
              >
                Đăng nhập
              </button>
              <button
                className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('register');
                  setAuthError(null);
                }}
              >
                Tạo tài khoản mới
              </button>
            </div>

            <div className="auth-modal-body">
              {authError && (
                <div className="auth-error-banner">
                  <AlertTriangle size={15} />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit}>
                {authMode === 'register' && (
                  <div className="auth-input-group">
                    <label className="auth-input-label">Họ và tên</label>
                    <div className="auth-input-box">
                      <User size={16} color="#94a3b8" />
                      <input
                        type="text"
                        placeholder="Nguyễn Văn A"
                        value={authForm.fullName}
                        onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="auth-input-group">
                  <label className="auth-input-label">Email</label>
                  <div className="auth-input-box">
                    <Mail size={16} color="#94a3b8" />
                    <input
                      type="email"
                      required
                      placeholder="ban@example.com"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label className="auth-input-label">Mật khẩu</label>
                  <div className="auth-input-box">
                    <Lock size={16} color="#94a3b8" />
                    <input
                      type="password"
                      required
                      placeholder="Tối thiểu 6 ký tự"
                      value={authForm.password}
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={isAuthSubmitting}
                  style={{ marginTop: 8 }}
                >
                  {isAuthSubmitting ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : authMode === 'login' ? (
                    <LogIn size={16} />
                  ) : (
                    <User size={16} />
                  )}
                  <span>{isAuthSubmitting ? 'Đang xử lý...' : authMode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
