"use client";

import { useState, useEffect } from "react";
import { TEAM_MEMBERS, TEAM_MEMBER_NAMES } from "@/lib/constants/team";
import { getTags, type Tag } from "@/lib/utils/tags";
import { getTemplates, saveTemplate, deleteTemplate, type TaskTemplate } from "@/lib/utils/templates";
import { addBookmark, removeBookmark, isBookmarked } from "@/lib/utils/bookmarks";
import { addActivityLog } from "@/lib/utils/activityLog";
import { addNotification } from "@/lib/utils/notifications";
import { exportTasksToCSV, exportTasksToJSON } from "@/lib/utils/export";
import { saveFile, getFile, deleteFile, getImageUrl } from "@/lib/utils/storage";

interface Attachment {
  id: string;
  name: string;
  type: string; // 'image', 'file', 'html', etc.
  size: number;
  url?: string; // 파일 URL 또는 데이터 URL
  uploadedBy: string;
  uploadedAt: string;
}

interface Comment {
  id: string;
  taskId: string;
  author: string;
  content: string;
  date: string;
  isFeedbackRequest: boolean;
  attachments?: Attachment[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: string;
  dueDate: string;
  comments: Comment[];
  tags?: string[];
  isBookmarked?: boolean;
  progress?: number; // 0-100
  createdBy?: string; // 작성자
  attachments?: Attachment[];
}

export default function TasksPage() {
  const currentUser = "김찬주"; // TODO: 실제 사용자 정보로 교체
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterBy, setFilterBy] = useState<string>("전체");
  const [statusFilter, setStatusFilter] = useState<string>("전체");
  const [tagFilter, setTagFilter] = useState<string>("전체");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isFeedbackRequest, setIsFeedbackRequest] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [taskAttachments, setTaskAttachments] = useState<File[]>([]);
  const [commentAttachments, setCommentAttachments] = useState<File[]>([]);
  
  // 작성자 확인 함수
  const isCreator = (task: Task) => {
    return task.createdBy === currentUser;
  };
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    assignedTo: "김찬주",
    dueDate: new Date().toISOString().split("T")[0],
    tags: [] as string[],
    progress: 0,
  });

  // 태그 및 템플릿 로드
  useEffect(() => {
    setTags(getTags());
    setTemplates(getTemplates());
  }, []);

  // 로컬 스토리지에서 작업 로드
  useEffect(() => {
    const savedTasks = localStorage.getItem("team-dashboard-tasks");
    if (savedTasks) {
      try {
        const loadedTasks = JSON.parse(savedTasks);
        // 북마크 상태 추가
        const tasksWithBookmarks = loadedTasks.map((task: Task) => ({
          ...task,
          isBookmarked: isBookmarked('task', task.id),
        }));
        setTasks(tasksWithBookmarks);
      } catch (e) {
        console.error("작업 로드 실패:", e);
      }
    } else {
      // 초기 예시 데이터
      const initialTasks: Task[] = [
        {
          id: "1",
          title: "대시보드 UI 완성",
          description: "대시보드 메인 페이지의 UI를 완성하고 통계 카드와 최근 활동 섹션을 구현합니다.",
          status: "in_progress",
          priority: "high",
          assignedTo: "이나영",
          dueDate: "2025-01-10",
          comments: [],
          tags: ["1", "3"], // 프론트엔드, 디자인
          isBookmarked: false,
          progress: 75,
          createdBy: "이나영",
        },
        {
          id: "2",
          title: "인증 시스템 구현",
          description: "링크 기반 인증 시스템을 구현하여 팀원만 접근할 수 있도록 합니다.",
          status: "todo",
          priority: "high",
          assignedTo: "박건희",
          dueDate: "2025-01-12",
          comments: [],
          tags: ["2"], // 백엔드
          isBookmarked: true,
          progress: 0,
          createdBy: "김찬주",
        },
        {
          id: "3",
          title: "일정 관리 기능",
          description: "캘린더에서 일정을 추가, 수정, 삭제할 수 있는 기능을 구현합니다.",
          status: "in_progress",
          priority: "medium",
          assignedTo: "박건희",
          dueDate: "2025-01-15",
          comments: [],
          tags: ["2"], // 백엔드
          isBookmarked: false,
          progress: 50,
          createdBy: "박건희",
        },
        {
          id: "4",
          title: "마케팅 전략 수립",
          description: "2025년 상반기 마케팅 전략을 수립하고 실행 계획을 작성합니다.",
          status: "done",
          priority: "low",
          assignedTo: "김예린",
          dueDate: "2025-01-08",
          comments: [],
          tags: ["6"], // 기획
          isBookmarked: false,
          progress: 100,
          createdBy: "김예린",
        },
      ];
      setTasks(initialTasks);
      localStorage.setItem("team-dashboard-tasks", JSON.stringify(initialTasks));
    }
  }, []);

  // 작업 저장
  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem("team-dashboard-tasks", JSON.stringify(newTasks));
  };

  // 파일 첨부 처리
  const handleFileUpload = async (files: File[], isComment: boolean = false): Promise<Attachment[]> => {
    const attachments: Attachment[] = [];
    
    for (const file of files) {
      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const fileType = file.type.startsWith('image/') ? 'image' : 
                      file.type === 'text/html' ? 'html' : 'file';
      
      // IndexedDB에 파일 저장
      await saveFile(
        {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedBy: currentUser,
          date: new Date().toISOString(),
          isImage: file.type.startsWith('image/'),
        },
        file
      );
      
      // 이미지인 경우 URL 생성
      let url: string | undefined;
      if (file.type.startsWith('image/')) {
        url = URL.createObjectURL(file);
      }
      
      attachments.push({
        id: fileId,
        name: file.name,
        type: fileType,
        size: file.size,
        url,
        uploadedBy: currentUser,
        uploadedAt: new Date().toISOString(),
      });
    }
    
    return attachments;
  };

  // 작업 추가
  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      alert("작업 제목을 입력해주세요.");
      return;
    }

    // 첨부파일 처리
    const attachments = taskAttachments.length > 0 
      ? await handleFileUpload(taskAttachments, false)
      : [];

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      status: newTask.status,
      priority: newTask.priority,
      assignedTo: newTask.assignedTo,
      dueDate: newTask.dueDate,
      comments: [],
      tags: newTask.tags || [],
      isBookmarked: false,
      progress: newTask.progress || 0,
      createdBy: currentUser,
      attachments,
    };

    saveTasks([...tasks, task]);
    
    // 첨부파일 초기화
    setTaskAttachments([]);
    
    // 활동 로그 추가
    addActivityLog({
      type: 'task',
      action: '작업을 생성했습니다',
      user: currentUser,
      targetId: task.id,
      targetTitle: task.title,
    });

    setNewTask({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      assignedTo: "김찬주",
      dueDate: new Date().toISOString().split("T")[0],
      tags: [],
      progress: 0,
    });
    setTaskAttachments([]);
    setShowAddForm(false);
  };

  // 템플릿에서 작업 생성
  const handleUseTemplate = (template: TaskTemplate) => {
    setNewTask({
      title: template.title,
      description: template.description,
      status: "todo",
      priority: template.priority,
      assignedTo: "김찬주",
      progress: 0,
      dueDate: new Date().toISOString().split("T")[0],
      tags: template.tags || [],
    });
    setShowTemplateModal(false);
    setShowAddForm(true);
  };

  // 템플릿 저장
  const handleSaveAsTemplate = () => {
    if (!newTask.title.trim()) {
      alert("작업 제목을 입력해주세요.");
      return;
    }
    
    const template = saveTemplate({
      name: newTask.title,
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      tags: newTask.tags || [],
    });
    
    setTemplates([...templates, template]);
    alert("템플릿이 저장되었습니다.");
  };

  // 북마크 토글
  const handleToggleBookmark = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (isBookmarked('task', taskId)) {
      removeBookmark('task', taskId);
    } else {
      addBookmark('task', taskId);
    }
    
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, isBookmarked: !t.isBookmarked } : t
    );
    setTasks(updatedTasks);
    
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, isBookmarked: !selectedTask.isBookmarked });
    }
  };

  // 작업 삭제
  const handleDeleteTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    
    // 작성자 확인
    if (!isCreator(task)) {
      alert("작성자만 삭제할 수 있습니다.");
      return;
    }
    
    if (confirm("작업을 삭제하시겠습니까?")) {
      // 활동 로그 추가
      addActivityLog({
        type: 'task',
        action: '작업을 삭제했습니다',
        user: currentUser,
        targetId: id,
        targetTitle: task.title,
      });
      saveTasks(tasks.filter((t) => t.id !== id));
    }
  };

  // 작업 상태 변경
  const handleStatusChange = (id: string, newStatus: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    // 작성자 확인
    if (!isCreator(task)) {
      alert("작성자만 상태를 변경할 수 있습니다.");
      return;
    }
    
    // 상태에 따라 진척도 자동 업데이트
    let progress = task.progress || 0;
    if (newStatus === 'done') {
      progress = 100;
    } else if (newStatus === 'todo' && task.status !== 'todo') {
      // 할 일로 변경할 때는 진척도 유지 (사용자가 설정한 값 유지)
      progress = task.progress || 0;
    }
    
    const updatedTasks = tasks.map((t) => (t.id === id ? { ...t, status: newStatus, progress } : t));
    saveTasks(updatedTasks);
    
    // 활동 로그 추가
    addActivityLog({
      type: 'status_change',
      action: `상태를 "${newStatus === 'done' ? '완료' : newStatus === 'in_progress' ? '진행 중' : '할 일'}"로 변경했습니다`,
      user: "김찬주",
      targetId: id,
      targetTitle: task.title,
    });
    
    // 완료 시 알림
    if (newStatus === 'done') {
      addNotification({
        type: 'task',
        title: '작업 완료',
        message: `"${task.title}" 작업이 완료되었습니다.`,
        taskId: id,
      });
    }
    
    // 선택된 작업도 업데이트
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask({ ...selectedTask, status: newStatus });
    }
  };

  // 댓글 추가
  const handleAddComment = async (taskId: string) => {
    if (!newComment.trim() && commentAttachments.length === 0) {
      alert("댓글을 입력하거나 파일을 첨부해주세요.");
      return;
    }

    const currentUser = "김찬주"; // TODO: 실제 사용자 정보로 교체
    
    // 첨부파일 처리
    const attachments = commentAttachments.length > 0 
      ? await handleFileUpload(commentAttachments, true)
      : [];

    const comment: Comment = {
      id: Date.now().toString(),
      taskId,
      author: currentUser,
      content: newComment,
      date: new Date().toISOString(),
      isFeedbackRequest,
      attachments,
    };

    const updatedTasks = tasks.map((t) =>
      t.id === taskId
        ? { ...t, comments: [...(t.comments || []), comment] }
        : t
    );
    
    // 첨부파일 초기화
    setCommentAttachments([]);
    setNewComment("");
    setIsFeedbackRequest(false);

    saveTasks(updatedTasks);
    
    // 선택된 작업도 업데이트
    if (selectedTask && selectedTask.id === taskId) {
      const updatedTask = updatedTasks.find((t) => t.id === taskId);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }

    setNewComment("");
    setIsFeedbackRequest(false);

    // 댓글 알림
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      if (isFeedbackRequest) {
        addNotification({
          type: 'feedback',
          title: '피드백 요청',
          message: `"${task.title}" 작업에 피드백이 요청되었습니다.`,
          taskId: taskId,
        });
      } else {
        addNotification({
          type: 'comment',
          title: '새 댓글',
          message: `"${task.title}" 작업에 댓글이 추가되었습니다.`,
          taskId: taskId,
        });
      }

      // 활동 로그 추가
      addActivityLog({
        type: 'comment',
        action: isFeedbackRequest ? '피드백을 요청했습니다' : '댓글을 작성했습니다',
        user: currentUser,
        targetId: taskId,
        targetTitle: task.title,
      });
    }
  };

  // 댓글 삭제
  const handleDeleteComment = (taskId: string, commentId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    
    const comment = task.comments?.find((c) => c.id === commentId);
    if (!comment) return;
    
    // 작성자 확인
    if (comment.author !== currentUser) {
      alert("댓글 작성자만 삭제할 수 있습니다.");
      return;
    }
    
    if (confirm("댓글을 삭제하시겠습니까?")) {
      const updatedTasks = tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              comments: (t.comments || []).filter((c) => c.id !== commentId),
            }
          : t
      );

      saveTasks(updatedTasks);
      
      // 선택된 작업도 업데이트
      if (selectedTask && selectedTask.id === taskId) {
        const updatedTask = updatedTasks.find((t) => t.id === taskId);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      }
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString("ko-KR");
  };

  // 필터링된 작업
  const filteredTasks = tasks.filter((task) => {
    if (filterBy !== "전체" && task.assignedTo !== filterBy) {
      return false;
    }
    if (statusFilter !== "전체") {
      if (statusFilter === "할 일" && task.status !== "todo") return false;
      if (statusFilter === "진행 중" && task.status !== "in_progress")
        return false;
      if (statusFilter === "완료" && task.status !== "done") return false;
    }
    if (tagFilter !== "전체" && (!task.tags || !task.tags.includes(tagFilter))) {
      return false;
    }
    return true;
  });

  const getMemberInfo = (name: string) => {
    return (
      TEAM_MEMBERS[name as keyof typeof TEAM_MEMBERS] || {
        role: "",
        initial: name[0],
        color: "#6B7280",
      }
    );
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "done":
        return { label: "완료", color: "bg-[#10B981] text-white" };
      case "in_progress":
        return { label: "진행 중", color: "bg-[#F59E0B] text-white" };
      default:
        return { label: "할 일", color: "bg-[#6B7280] text-white" };
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return { label: "높음", color: "text-[#EF4444]" };
      case "medium":
        return { label: "보통", color: "text-[#F59E0B]" };
      default:
        return { label: "낮음", color: "text-[#6B7280]" };
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* 헤더 */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-[#111827] leading-tight">
                프로젝트룸
              </h1>
              <p className="text-xs text-[#6B7280] mt-1 leading-tight">
                총 {filteredTasks.length}개 작업
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportTasksToCSV(tasks)}
                className="px-3 py-1.5 border border-[#E5E7EB] text-[#6B7280] text-sm font-medium rounded-md hover:bg-[#F9FAFB] transition-colors leading-tight"
                title="CSV 내보내기"
              >
                내보내기
              </button>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="px-3 py-1.5 border border-[#E5E7EB] text-[#6B7280] text-sm font-medium rounded-md hover:bg-[#F9FAFB] transition-colors leading-tight"
              >
                템플릿
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-3.5 py-1.5 bg-[#3B82F6] text-white text-sm font-medium rounded-md hover:bg-[#60A5FA] transition-colors leading-tight"
              >
                작업 추가
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* 작업 추가 폼 */}
          {showAddForm && (
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-[#111827] leading-tight">
                  작업 추가
                </h2>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewTask({
                      title: "",
                      description: "",
                      status: "todo",
                      priority: "medium",
                      assignedTo: "김찬주",
                      dueDate: new Date().toISOString().split("T")[0],
                      tags: [],
                      progress: 0,
                    });
                    setTaskAttachments([]);
                  }}
                  className="text-[#6B7280] hover:text-[#111827] text-lg"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[#111827] mb-1">
                    제목
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="작업 제목"
                    autoFocus
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[#111827] mb-1">
                    상세 내용
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] min-h-[100px] resize-y"
                    placeholder="작업에 대한 상세 설명을 입력하세요..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[#111827] mb-1">
                    파일 첨부 (사진, 파일, HTML 등)
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setTaskAttachments([...taskAttachments, ...files]);
                    }}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                  {taskAttachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {taskAttachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-[#F9FAFB] rounded border border-[#E5E7EB]">
                          <span className="text-xs text-[#111827] truncate flex-1">{file.name}</span>
                          <span className="text-xs text-[#6B7280] ml-2">{(file.size / 1024).toFixed(1)}KB</span>
                          <button
                            onClick={() => setTaskAttachments(taskAttachments.filter((_, i) => i !== index))}
                            className="text-[#6B7280] hover:text-[#EF4444] text-xs ml-2"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#111827] mb-1">
                    담당자
                  </label>
                  <select
                    value={newTask.assignedTo}
                    onChange={(e) =>
                      setNewTask({ ...newTask, assignedTo: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    {TEAM_MEMBER_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name} ({TEAM_MEMBERS[name].role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#111827] mb-1">
                    우선순위
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="low">낮음</option>
                    <option value="medium">보통</option>
                    <option value="high">높음</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#111827] mb-1">
                    상태
                  </label>
                  <select
                    value={newTask.status}
                    onChange={(e) =>
                      setNewTask({ ...newTask, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="todo">할 일</option>
                    <option value="in_progress">진행 중</option>
                    <option value="done">완료</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#111827] mb-1">
                    마감일
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#111827] mb-1">
                    진척도 ({newTask.progress}%)
                  </label>
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={newTask.progress}
                      onChange={(e) =>
                        setNewTask({ ...newTask, progress: parseInt(e.target.value) })
                      }
                      className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                    />
                    <div className="flex items-center justify-between text-xs text-[#6B7280]">
                      <span>0%</span>
                      <span className="font-medium text-[#111827]">{newTask.progress}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[#111827] mb-1">
                    태그
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          const currentTags = newTask.tags || [];
                          if (currentTags.includes(tag.id)) {
                            setNewTask({
                              ...newTask,
                              tags: currentTags.filter((t) => t !== tag.id),
                            });
                          } else {
                            setNewTask({
                              ...newTask,
                              tags: [...currentTags, tag.id],
                            });
                          }
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium leading-tight transition-colors ${
                          newTask.tags?.includes(tag.id)
                            ? "text-white"
                            : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
                        }`}
                        style={
                          newTask.tags?.includes(tag.id)
                            ? { backgroundColor: tag.color }
                            : {}
                        }
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSaveAsTemplate}
                  className="px-3 py-2 border border-[#E5E7EB] rounded-md text-sm font-medium text-[#6B7280] hover:bg-[#F9FAFB]"
                >
                  템플릿 저장
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewTask({
                      title: "",
                      description: "",
                      status: "todo",
                      priority: "medium",
                      assignedTo: "김찬주",
                      dueDate: new Date().toISOString().split("T")[0],
                      tags: [],
                      progress: 0,
                    });
                    setTaskAttachments([]);
                  }}
                  className="flex-1 px-4 py-2 border border-[#E5E7EB] rounded-md text-sm font-medium text-[#6B7280] hover:bg-[#F9FAFB]"
                >
                  취소
                </button>
                <button
                  onClick={handleAddTask}
                  className="flex-1 px-4 py-2 bg-[#3B82F6] text-white rounded-md text-sm font-medium hover:bg-[#60A5FA]"
                >
                  추가
                </button>
              </div>
            </div>
          )}

          {/* 담당자 필터 */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <button
              onClick={() => setFilterBy("전체")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md leading-tight transition-colors ${
                filterBy === "전체"
                  ? "bg-[#3B82F6] text-white"
                  : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
              }`}
            >
              전체
            </button>
            {Object.values(TEAM_MEMBERS).map((member) => (
              <button
                key={member.name}
                onClick={() => setFilterBy(member.name)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md leading-tight transition-colors ${
                  filterBy === member.name
                    ? "text-white"
                    : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
                }`}
                style={
                  filterBy === member.name
                    ? { backgroundColor: member.color }
                    : {}
                }
              >
                {member.name} ({member.role})
              </button>
            ))}
          </div>

          {/* 태그 필터 */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <button
              onClick={() => setTagFilter("전체")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md leading-tight transition-colors ${
                tagFilter === "전체"
                  ? "bg-[#3B82F6] text-white"
                  : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
              }`}
            >
              전체
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setTagFilter(tagFilter === tag.id ? "전체" : tag.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md leading-tight transition-colors ${
                  tagFilter === tag.id
                    ? "text-white"
                    : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
                }`}
                style={
                  tagFilter === tag.id
                    ? { backgroundColor: tag.color }
                    : {}
                }
              >
                {tag.name}
              </button>
            ))}
          </div>

          {/* 상태 필터 */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setStatusFilter("전체")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md leading-tight transition-colors ${
                statusFilter === "전체"
                  ? "bg-[#3B82F6] text-white"
                  : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setStatusFilter("할 일")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md leading-tight transition-colors ${
                statusFilter === "할 일"
                  ? "bg-[#3B82F6] text-white"
                  : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
              }`}
            >
              할 일
            </button>
            <button
              onClick={() => setStatusFilter("진행 중")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md leading-tight transition-colors ${
                statusFilter === "진행 중"
                  ? "bg-[#3B82F6] text-white"
                  : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
              }`}
            >
              진행 중
            </button>
            <button
              onClick={() => setStatusFilter("완료")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md leading-tight transition-colors ${
                statusFilter === "완료"
                  ? "bg-[#3B82F6] text-white"
                  : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
              }`}
            >
              완료
            </button>
          </div>

          {/* 작업 목록 */}
          <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
            {filteredTasks.length > 0 ? (
              <div className="divide-y divide-[#E5E7EB]">
                {filteredTasks.map((task) => {
                  const statusInfo = getStatusLabel(task.status);
                  const priorityInfo = getPriorityLabel(task.priority);

                  const isExpanded = selectedTask?.id === task.id;
                  // 확장된 작업의 경우 최신 데이터 사용
                  const displayTask = isExpanded && selectedTask ? selectedTask : task;
                  const memberColor = TEAM_MEMBERS[task.assignedTo as keyof typeof TEAM_MEMBERS]?.color || '#2563EB';
                  return (
                    <div key={task.id}>
                      <div
                        className="p-4 hover:bg-[#F9FAFB] transition-colors cursor-pointer border-l-4"
                        style={{ borderLeftColor: memberColor, borderTopColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'transparent' }}
                        onClick={() => setSelectedTask(isExpanded ? null : task)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                              <h3 className="text-sm font-semibold text-[#111827] leading-tight">
                                {task.title}
                              </h3>
                              {task.isBookmarked && (
                                <span className="text-[#F59E0B]" title="북마크됨">
                                  ⭐
                                </span>
                              )}
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs font-medium leading-tight ${statusInfo.color}`}
                              >
                                {statusInfo.label}
                              </span>
                              <span
                                className={`text-xs font-medium leading-tight ${priorityInfo.color}`}
                              >
                                {priorityInfo.label}
                              </span>
                              {task.tags && task.tags.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  {task.tags.map((tagId) => {
                                    const tag = tags.find((t) => t.id === tagId);
                                    if (!tag) return null;
                                    return (
                                      <span
                                        key={tagId}
                                        className="px-1.5 py-0.5 rounded text-xs font-medium text-white leading-tight"
                                        style={{ backgroundColor: tag.color }}
                                      >
                                        {tag.name}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[#6B7280] leading-tight mb-1">
                              <span>
                                담당: {task.assignedTo} ({getMemberInfo(task.assignedTo).role})
                              </span>
                              <span>•</span>
                              <span>마감: {task.dueDate}</span>
                              {task.comments && task.comments.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span>댓글 {task.comments.length}개</span>
                                </>
                              )}
                            </div>
                            {!isExpanded && task.description && (
                              <p className="text-xs text-[#6B7280] line-clamp-2 leading-tight mb-1">
                                {task.description}
                              </p>
                            )}
                            {/* 진척도 표시 */}
                            {task.progress !== undefined && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-[#6B7280] leading-tight">진척도</span>
                                  <span className="text-xs font-medium text-[#111827] leading-tight">{task.progress}%</span>
                                </div>
                                <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                                  <div
                                    className="h-full transition-all duration-300 rounded-full"
                                    style={{ width: `${task.progress}%`, backgroundColor: memberColor }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleBookmark(task.id);
                              }}
                              className={`text-sm transition-colors ${
                                task.isBookmarked
                                  ? "text-[#F59E0B]"
                                  : "text-[#6B7280] hover:text-[#F59E0B]"
                              }`}
                              title={task.isBookmarked ? "북마크 제거" : "북마크 추가"}
                            >
                              ⭐
                            </button>
                            {isCreator(task) && (
                              <select
                                value={task.status}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(task.id, e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="px-2 py-1 text-xs border border-[#E5E7EB] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                              >
                                <option value="todo">할 일</option>
                                <option value="in_progress">진행 중</option>
                                <option value="done">완료</option>
                              </select>
                            )}
                            {isCreator(task) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(task.id);
                                }}
                                className="text-[#EF4444] hover:text-[#DC2626] text-sm"
                                title="삭제"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 확장된 상세 내용 */}
                      {isExpanded && (() => {
                        const displayMemberColor = TEAM_MEMBERS[displayTask.assignedTo as keyof typeof TEAM_MEMBERS]?.color || '#2563EB';
                        return (
                        <div className="px-4 pb-4 border-t border-[#E5E7EB] bg-[#F9FAFB]">
                          {/* 상태 변경 */}
                          {isCreator(displayTask) && (
                            <div className="pt-4 mb-4">
                              <label className="block text-xs font-medium text-[#111827] mb-1">
                                상태 변경
                              </label>
                              <select
                                value={displayTask.status}
                                onChange={(e) => {
                                  handleStatusChange(displayTask.id, e.target.value);
                                }}
                                className="px-3 py-2 text-sm border border-[#E5E7EB] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                              >
                                <option value="todo">할 일</option>
                                <option value="in_progress">진행 중</option>
                                <option value="done">완료</option>
                              </select>
                            </div>
                          )}

                          {/* 진척도 수정 */}
                          {isCreator(displayTask) && (
                            <div className="mb-4">
                              <label className="block text-xs font-medium text-[#111827] mb-1">
                                진척도 ({displayTask.progress || 0}%)
                              </label>
                              <div className="space-y-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={displayTask.progress || 0}
                                  onChange={(e) => {
                                    if (!isCreator(displayTask)) {
                                      alert("작성자만 진척도를 수정할 수 있습니다.");
                                      return;
                                    }
                                    const newProgress = parseInt(e.target.value);
                                    const updatedTasks = tasks.map((t) =>
                                      t.id === displayTask.id ? { ...t, progress: newProgress } : t
                                    );
                                    saveTasks(updatedTasks);
                                    setSelectedTask({ ...displayTask, progress: newProgress });
                                  }}
                                  className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer"
                                  style={{ accentColor: displayMemberColor }}
                                />
                              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                                <span>0%</span>
                                <span className="font-medium text-[#111827]">{displayTask.progress || 0}%</span>
                                <span>100%</span>
                              </div>
                              <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                                <div
                                  className="h-full transition-all duration-300 rounded-full"
                                  style={{ width: `${displayTask.progress || 0}%`, backgroundColor: displayMemberColor }}
                                />
                              </div>
                            </div>
                          </div>
                          )}

                          {/* 상세 내용 */}
                          <div className="mb-4">
                            <h3 className="text-sm font-semibold text-[#111827] mb-2 leading-tight">
                              상세 내용
                            </h3>
                            <div className="bg-white rounded-md p-3 border border-[#E5E7EB]">
                              {displayTask.description ? (
                                <p className="text-sm text-[#111827] whitespace-pre-wrap leading-relaxed">
                                  {displayTask.description}
                                </p>
                              ) : (
                                <p className="text-sm text-[#9CA3AF]">상세 내용이 없습니다.</p>
                              )}
                            </div>
                            {displayTask.attachments && displayTask.attachments.length > 0 && (
                              <div className="mt-3">
                                <h4 className="text-xs font-semibold text-[#111827] mb-2 leading-tight">
                                  첨부파일 ({displayTask.attachments.length})
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {displayTask.attachments.map((attachment) => (
                                    <div key={attachment.id} className="flex items-center gap-2 p-2 bg-[#F9FAFB] rounded border border-[#E5E7EB]">
                                      {attachment.type === 'image' && attachment.url ? (
                                        <img src={attachment.url} alt={attachment.name} className="w-12 h-12 object-cover rounded" />
                                      ) : (
                                        <div className="w-10 h-10 bg-[#E5E7EB] rounded flex items-center justify-center flex-shrink-0">
                                          <span className="text-sm">{attachment.type === 'html' ? '🌐' : '📎'}</span>
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-[#111827] truncate">{attachment.name}</div>
                                        <div className="text-xs text-[#6B7280]">{(attachment.size / 1024).toFixed(1)}KB</div>
                                      </div>
                                      <button
                                        onClick={async () => {
                                          const file = await getFile(attachment.id);
                                          if (file) {
                                            const url = URL.createObjectURL(file);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = attachment.name;
                                            a.click();
                                            URL.revokeObjectURL(url);
                                          }
                                        }}
                                        className="text-xs text-[#3B82F6] hover:text-[#60A5FA] flex-shrink-0"
                                      >
                                        다운로드
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 댓글 섹션 */}
                          <div className="mb-4">
                            <h3 className="text-sm font-semibold text-[#111827] mb-3 leading-tight">
                              댓글 및 피드백 ({displayTask.comments?.length || 0})
                            </h3>

                            {/* 댓글 목록 */}
                            <div className="space-y-2 mb-4">
                              {displayTask.comments && displayTask.comments.length > 0 ? (
                                displayTask.comments.map((comment) => {
                                  const memberInfo = getMemberInfo(comment.author);
                                  return (
                                    <div
                                      key={comment.id}
                                      className={`p-3 rounded-md border ${
                                        comment.isFeedbackRequest
                                          ? "bg-[#FEF3C7] border-[#F59E0B]"
                                          : "bg-white border-[#E5E7EB]"
                                      }`}
                                    >
                                      <div className="flex items-start justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                                            style={{ backgroundColor: memberInfo.color }}
                                          >
                                            {memberInfo.initial}
                                          </div>
                                          <span className="text-xs font-medium text-[#111827] leading-tight">
                                            {comment.author}
                                          </span>
                                          {comment.isFeedbackRequest && (
                                            <span className="px-1.5 py-0.5 bg-[#F59E0B] text-white text-xs font-medium rounded leading-tight">
                                              피드백 요청
                                            </span>
                                          )}
                                          <span className="text-xs text-[#9CA3AF] leading-tight">
                                            {formatDate(comment.date)}
                                          </span>
                                        </div>
                                        {comment.author === currentUser && (
                                          <button
                                            onClick={() => handleDeleteComment(displayTask.id, comment.id)}
                                            className="text-[#6B7280] hover:text-[#EF4444] text-xs"
                                          >
                                            ×
                                          </button>
                                        )}
                                      </div>
                                      <p className="text-sm text-[#111827] leading-relaxed mt-1">
                                        {comment.content}
                                      </p>
                                      {comment.attachments && comment.attachments.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                          {comment.attachments.map((attachment) => (
                                            <div key={attachment.id} className="flex items-center gap-2 p-2 bg-[#F9FAFB] rounded border border-[#E5E7EB]">
                                              {attachment.type === 'image' && attachment.url ? (
                                                <img src={attachment.url} alt={attachment.name} className="w-12 h-12 object-cover rounded" />
                                              ) : (
                                                <div className="w-8 h-8 bg-[#E5E7EB] rounded flex items-center justify-center">
                                                  <span className="text-xs text-[#6B7280]">📎</span>
                                                </div>
                                              )}
                                              <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-[#111827] truncate">{attachment.name}</div>
                                                <div className="text-xs text-[#6B7280]">{(attachment.size / 1024).toFixed(1)}KB</div>
                                              </div>
                                              <button
                                                onClick={async () => {
                                                  const file = await getFile(attachment.id);
                                                  if (file) {
                                                    const url = URL.createObjectURL(file);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = attachment.name;
                                                    a.click();
                                                    URL.revokeObjectURL(url);
                                                  }
                                                }}
                                                className="text-xs text-[#3B82F6] hover:text-[#60A5FA]"
                                              >
                                                다운로드
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-sm text-[#9CA3AF] text-center py-4 bg-white rounded-md border border-[#E5E7EB]">
                                  댓글이 없습니다.
                                </p>
                              )}
                            </div>

                            {/* 댓글 작성 */}
                            <div className="border-t border-[#E5E7EB] pt-4 bg-white rounded-md p-3 border-x border-b">
                              <div className="mb-2">
                                <label className="flex items-center gap-2 text-xs text-[#111827]">
                                  <input
                                    type="checkbox"
                                    checked={isFeedbackRequest}
                                    onChange={(e) => setIsFeedbackRequest(e.target.checked)}
                                    className="w-4 h-4 text-[#3B82F6] border-[#E5E7EB] rounded focus:ring-[#3B82F6]"
                                  />
                                  <span>피드백 요청으로 등록</span>
                                </label>
                              </div>
                              <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] min-h-[80px] resize-y mb-2"
                                placeholder={isFeedbackRequest ? "피드백을 요청하세요..." : "댓글을 입력하세요..."}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="mb-2">
                                <input
                                  type="file"
                                  multiple
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    setCommentAttachments([...commentAttachments, ...files]);
                                  }}
                                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                {commentAttachments.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {commentAttachments.map((file, index) => (
                                      <div key={index} className="flex items-center justify-between p-2 bg-[#F9FAFB] rounded border border-[#E5E7EB]">
                                        <span className="text-xs text-[#111827] truncate flex-1">{file.name}</span>
                                        <span className="text-xs text-[#6B7280] ml-2">{(file.size / 1024).toFixed(1)}KB</span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setCommentAttachments(commentAttachments.filter((_, i) => i !== index));
                                          }}
                                          className="text-[#6B7280] hover:text-[#EF4444] text-xs ml-2"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddComment(displayTask.id);
                                }}
                                className="px-4 py-2 bg-[#3B82F6] text-white text-sm font-medium rounded-md hover:bg-[#60A5FA] transition-colors"
                              >
                                {isFeedbackRequest ? "피드백 요청" : "댓글 작성"}
                              </button>
                            </div>
                          </div>
                        </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-[#9CA3AF]">작업이 없습니다</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 템플릿 모달 */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#111827] leading-tight">
                  작업 템플릿
                </h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-[#6B7280] hover:text-[#111827] text-2xl"
                >
                  ×
                </button>
              </div>
              {templates.length > 0 ? (
                <div className="space-y-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleUseTemplate(template)}
                      className="w-full p-3 text-left bg-[#F9FAFB] rounded-md border border-[#E5E7EB] hover:border-[#2563EB] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-[#111827] mb-1 leading-tight">
                            {template.name}
                          </h3>
                          <p className="text-xs text-[#6B7280] line-clamp-2 leading-tight">
                            {template.description}
                          </p>
                          {template.tags && template.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                              {template.tags.map((tagId) => {
                                const tag = tags.find((t) => t.id === tagId);
                                if (!tag) return null;
                                return (
                                  <span
                                    key={tagId}
                                    className="px-1.5 py-0.5 rounded text-xs font-medium text-white leading-tight"
                                    style={{ backgroundColor: tag.color }}
                                  >
                                    {tag.name}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("템플릿을 삭제하시겠습니까?")) {
                              deleteTemplate(template.id);
                              setTemplates(templates.filter((t) => t.id !== template.id));
                            }
                          }}
                          className="text-[#6B7280] hover:text-[#EF4444] text-sm ml-4"
                        >
                          ×
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#9CA3AF] text-center py-8">
                  저장된 템플릿이 없습니다
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
