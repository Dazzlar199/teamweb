"use client";

import { useState, useMemo } from "react";
import { TEAM_MEMBERS } from "@/lib/constants/team";
import { useUser } from "@/lib/context/UserContext";
import { useData } from "@/lib/context/DataContext";
import { useToast } from "@/lib/context/ToastContext";
import { addActivityLog } from "@/lib/utils/activityLog";
import type { Task } from "@/lib/types/task";
import EnhancedEditor from "@/components/common/EnhancedEditor";

import { saveTask, deleteTask, updateTaskStatus as updateSupabaseTaskStatus } from "@/lib/utils/task";

export default function TasksPage() {
  const { user } = useUser();
  const { tasks, setTasks, refreshTasks } = useData();
  const { showToast } = useToast();
  const currentUser = user?.name || "김찬주";

  // 상태 관리
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setStatusFilter] = useState<"전체" | "todo" | "in_progress" | "done">("전체");
  const [filterPriority, setPriorityFilter] = useState<string>("전체");
  const [filterAssignee, setFilterAssignee] = useState<string>("전체"); // 인원 필터 추가
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "todo" as Task['status'],
    priority: "medium" as Task['priority'],
    assignedTo: currentUser,
    dueDate: new Date().toISOString().split('T')[0],
  });

  // 필터링된 작업 목록
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus = filterStatus === "전체" || task.status === filterStatus;
      const matchesPriority = filterPriority === "전체" || task.priority === filterPriority;
      const matchesAssignee = filterAssignee === "전체" || task.assignedTo === filterAssignee;
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesStatus && matchesPriority && matchesAssignee && matchesSearch;
    });
  }, [tasks, filterStatus, filterPriority, filterAssignee, searchQuery]);

  const updateTaskStatus = async (id: string, newStatus: Task['status']) => {
    try {
      // 낙관적 업데이트
      const updatedTasks = tasks.map(t =>
        t.id === id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
      );
      setTasks(updatedTasks);

      await updateSupabaseTaskStatus(id, newStatus);
      await refreshTasks(); // DataContext 동기화

      // 활동 로그 추가
      const task = tasks.find(t => t.id === id);
      if (task) {
        addActivityLog({
          user: currentUser,
          type: "task",
          action: `작업 상태를 ${newStatus === 'done' ? '완료' : newStatus}로 변경했습니다`,
          targetTitle: task.title,
        });
      }

      showToast(`상태가 변경되었습니다.`, "info");
    } catch (e) {
      await refreshTasks(); // 에러 시 복구
      showToast("상태 변경 실패", "error");
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      showToast("작업 제목을 입력해주세요.", "warning");
      return;
    }

    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      description: newTask.description,
      status: newTask.status,
      priority: newTask.priority,
      assignedTo: newTask.assignedTo,
      dueDate: newTask.dueDate,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser,
    };

    try {
      // 낙관적 업데이트
      setTasks([task, ...tasks]);

      // Supabase 및 LocalStorage 동시 저장
      await saveTask(task);
      await refreshTasks(); // DataContext 동기화

      addActivityLog({
        user: currentUser,
        type: "task",
        action: "새 작업을 생성했습니다",
        targetTitle: task.title,
      });

      showToast("새 작업이 Supabase에 저장되었습니다.", "success");
      setShowAddForm(false);

      // 폼 초기화
      setNewTask({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        assignedTo: currentUser,
        dueDate: new Date().toISOString().split('T')[0],
      });
    } catch (e) {
      await refreshTasks(); // 에러 시 복구
      showToast("작업 등록에 실패했습니다.", "error");
    }
  };


  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">프로젝트룸</h1>
            <p className="text-sm text-slate-500 font-medium">특별시 팀의 모든 업무와 진행 상황을 관리합니다</p>
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            새 작업 추가
          </button>
        </div>

        {/* 필터 바 */}
        <div className="glass-card p-4 rounded-2xl space-y-3">
          {/* 인원 필터 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-2">담당자</span>
            {(["전체", "김찬주", "박건희", "이나영", "김예린"] as const).map((person) => {
              const member = person !== "전체" ? TEAM_MEMBERS[person as keyof typeof TEAM_MEMBERS] : null;
              return (
                <button
                  key={person}
                  onClick={() => setFilterAssignee(person)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                    filterAssignee === person
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                      : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  {member && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: member.color }}
                    />
                  )}
                  {person === "전체" ? "전체 보기" : person}
                  {member && <span className="text-[10px] opacity-70">{member.role}</span>}
                </button>
              );
            })}
          </div>

          {/* 상태 & 우선순위 필터 */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(["전체", "todo", "in_progress", "done"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    filterStatus === s ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {s === "todo" ? "대기" : s === "in_progress" ? "진행" : s === "done" ? "완료" : "전체 상태"}
                </button>
              ))}
            </div>
          
          <select 
            value={filterPriority}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-white border border-slate-200 text-xs font-bold text-slate-600 px-3 py-2 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="전체">모든 우선순위</option>
            <option value="high">높음 (High)</option>
            <option value="medium">보통 (Mid)</option>
            <option value="low">낮음 (Low)</option>
          </select>

          <div className="flex-1 relative min-w-[200px]">
            <input
              type="text"
              placeholder="작업 명칭 또는 내용 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <svg className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          </div>
        </div>

        {/* 작업 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const member = TEAM_MEMBERS[task.assignedTo as keyof typeof TEAM_MEMBERS] || { color: "#64748b" };
              return (
                <div 
                  key={task.id} 
                  onClick={() => setSelectedTask(task)}
                  className="glass-card rounded-2xl overflow-hidden group cursor-pointer hover:ring-2 hover:ring-indigo-500/20 transition-all"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        task.priority === "high" ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"
                      }`}>
                        {task.priority}
                      </span>
                      <div className="flex gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTaskStatus(task.id, 'done');
                          }} 
                          className="p-1.5 text-slate-300 hover:text-emerald-500 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-[16px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{task.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {task.description ? task.description.replace(/<[^>]*>?/gm, '') : "설명이 없습니다."}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-sm" style={{ backgroundColor: member.color }}>
                          {task.assignedTo[0]}
                        </div>
                        <span className="text-xs font-bold text-slate-700">{task.assignedTo}</span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                        {task.dueDate}
                      </div>
                    </div>
                  </div>
                  
                  {/* 진행률 바 (상태별) */}
                  <div className="h-1.5 w-full bg-slate-100">
                    <div className={`h-full transition-all duration-500 ${
                      task.status === 'done' ? 'bg-emerald-500 w-full' : task.status === 'in_progress' ? 'bg-indigo-500 w-1/2' : 'bg-slate-300 w-1/4'
                    }`} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center glass-card rounded-3xl border-dashed">
              <p className="text-slate-400 font-medium">검색 결과와 일치하는 작업이 없습니다.</p>
            </div>
          )}
        </div>

        {/* 새 작업 추가 모달 (노션 스타일 대형 에디터) */}
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-6">
            <div className="bg-white rounded-[1.5rem] w-full max-w-[90vw] h-[92vh] shadow-2xl overflow-hidden animate-slide-in flex flex-col transition-all">
              {/* 모달 상단 바 */}
              <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <span className="ml-2 text-xs font-black text-slate-400 uppercase tracking-widest">New Project Document</span>
                </div>
                <button onClick={() => setShowAddForm(false)} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">✕</button>
              </div>

              {/* 스크롤 가능한 에디터 본문 */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 sm:p-16 space-y-12">
                {/* 제목 영역 (노션 스타일) */}
                <div className="max-w-5xl mx-auto w-full space-y-6">
                  <input 
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    placeholder="제목 없음"
                    className="w-full bg-transparent border-none text-5xl font-black text-slate-900 placeholder:text-slate-200 outline-none p-0 focus:ring-0 leading-tight"
                  />
                  
                  <div className="flex flex-wrap gap-8 border-b border-slate-100 pb-8">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-16">담당자</span>
                      <div className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded-md cursor-pointer transition-colors">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">{currentUser[0]}</div>
                        <span className="text-sm font-medium text-slate-700">{currentUser}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-16">우선순위</span>
                      <select 
                        value={newTask.priority}
                        onChange={(e) => setNewTask({...newTask, priority: e.target.value as "low" | "medium" | "high"})}
                        className="bg-transparent border-none text-sm font-medium text-slate-700 px-2 py-1 outline-none cursor-pointer hover:bg-slate-50 rounded-md transition-colors"
                      >
                        <option value="high">🔴 긴급</option>
                        <option value="medium">🟡 보통</option>
                        <option value="low">🟢 낮음</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-16">마감일</span>
                      <input 
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                        className="bg-transparent border-none text-sm font-medium text-slate-700 px-2 py-1 outline-none cursor-pointer hover:bg-slate-50 rounded-md transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* 에디터 영역 */}
                <div className="max-w-5xl mx-auto w-full min-h-[600px]">
                  <EnhancedEditor
                    value={newTask.description}
                    onChange={(content) => setNewTask({...newTask, description: content})}
                    placeholder="내용을 입력하세요... (우측 상단 '사용 가이드' 버튼을 클릭하면 모든 기능을 확인할 수 있습니다)"
                  />
                </div>
              </div>

              {/* 하단 액션 바 */}
              <div className="p-6 bg-slate-50/80 backdrop-blur-sm border-t border-slate-100 flex justify-end gap-3 px-12 shrink-0">
                <button onClick={() => setShowAddForm(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">닫기</button>
                <button onClick={handleCreateTask} className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95">저장</button>
              </div>
            </div>
          </div>
        )}

        {/* 작업 상세보기 모달 */}
        {selectedTask && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 sm:p-6">
            <div className="bg-white rounded-[1.5rem] w-full max-w-[1200px] h-[90vh] shadow-2xl overflow-hidden animate-slide-in flex flex-col">
              <TaskDetailContent 
                task={selectedTask} 
                onClose={() => setSelectedTask(null)}
                onUpdate={(updatedTask) => {
                  const updatedTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
                  setTasks(updatedTasks);
                  localStorage.setItem("team-dashboard-tasks", JSON.stringify(updatedTasks));
                  setSelectedTask(updatedTask);
                  showToast("작업이 수정되었습니다.", "success");
                }}
                onDelete={async (id) => {
                  if(confirm("이 작업을 삭제하시겠습니까?")) {
                    try {
                      // 낙관적 업데이트
                      const updated = tasks.filter(t => t.id !== id);
                      setTasks(updated);

                      // Supabase 삭제
                      await deleteTask(id);
                      await refreshTasks(); // DataContext 동기화

                      setSelectedTask(null);
                      showToast("작업이 삭제되었습니다.", "info");
                    } catch (error) {
                      await refreshTasks(); // 에러 시 복구
                      showToast("작업 삭제에 실패했습니다.", "error");
                    }
                  }
                }}
                onStatusChange={(id, status) => updateTaskStatus(id, status)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 작업 상세 및 수정 컴포넌트 분리
function TaskDetailContent({ task, onClose, onUpdate, onDelete, onStatusChange }: { 
  task: Task, 
  onClose: () => void, 
  onUpdate: (t: Task) => void, 
  onDelete: (id: string) => void,
  onStatusChange: (id: string, status: Task['status']) => void 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task>(task);

  const handleSave = () => {
    onUpdate(editedTask);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <>
        {/* 수정 모드 헤더 */}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Editing Task</span>
          </div>
          <button onClick={() => setIsEditing(false)} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">✕</button>
        </div>

        {/* 수정 모드 본문 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 sm:p-12 space-y-10">
          <div className="space-y-4">
            <input 
              type="text"
              value={editedTask.title}
              onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
              className="w-full bg-transparent border-none text-4xl font-black text-slate-900 placeholder:text-slate-200 outline-none p-0 focus:ring-0"
            />
            
            <div className="flex flex-wrap gap-6 border-y border-slate-50 py-6">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black text-slate-400 uppercase w-20">담당자</span>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
                  <span className="text-sm font-bold text-slate-700">{editedTask.assignedTo}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black text-slate-400 uppercase w-20">우선순위</span>
                <select 
                  value={editedTask.priority}
                  onChange={(e) => setEditedTask({...editedTask, priority: e.target.value as Task['priority']})}
                  className="bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 px-3 py-1.5 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <option value="high">🔴 긴급</option>
                  <option value="medium">🟡 보통</option>
                  <option value="low">🟢 낮음</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black text-slate-400 uppercase w-20">마감일</span>
                <input 
                  type="date"
                  value={editedTask.dueDate}
                  onChange={(e) => setEditedTask({...editedTask, dueDate: e.target.value})}
                  className="bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 px-3 py-1.5 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="min-h-[500px]">
            <EnhancedEditor
              value={editedTask.description || ""}
              onChange={(content) => setEditedTask({...editedTask, description: content})}
              placeholder="내용을 입력하세요... (우측 상단 '사용 가이드' 버튼을 클릭하면 모든 기능을 확인할 수 있습니다)"
            />
          </div>
        </div>

        {/* 수정 모드 하단 바 */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-4 px-12">
          <button onClick={() => setIsEditing(false)} className="px-8 py-3 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">취소</button>
          <button onClick={handleSave} className="px-10 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95">저장하기</button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* 보기 모드 헤더 */}
      <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
            task.priority === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {task.priority} Priority
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Task Details</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
          >
            수정
          </button>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">✕</button>
        </div>
      </div>

      {/* 보기 모드 본문 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 sm:p-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-6">{task.title}</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-slate-50">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">담당자</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {task.assignedTo[0]}
                  </div>
                  <span className="text-sm font-bold text-slate-700">{task.assignedTo}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">상태</span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${
                    task.status === 'done' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-indigo-500' : 'bg-slate-300'
                  }`} />
                  <span className="text-sm font-bold text-slate-700 uppercase">{task.status}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">마감일</span>
                <div className="text-sm font-bold text-slate-700">{task.dueDate}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">작성자</span>
                <div className="text-sm font-bold text-slate-500">{task.createdBy || "미지정"}</div>
              </div>
            </div>
          </div>

          <div className="prose prose-slate max-w-none task-content-view">
            <div 
              className="text-slate-600 leading-relaxed min-h-[200px]"
              dangerouslySetInnerHTML={{ __html: task.description || "<p className='text-slate-400 italic'>작업 내용이 없습니다.</p>" }}
            />
          </div>
          {/* 뷰어 전용 스타일 */}
          <style jsx global>{`
            .task-content-view img {
              max-width: 100%;
              /* height: auto;  <-- 제거: 리사이징된 높이 유지 */
              border-radius: 8px;
              margin: 16px 0;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            .task-content-view a {
              color: #4f46e5;
              text-decoration: underline;
            }
            .task-content-view ul {
              list-style-type: disc;
              padding-left: 1.5em;
              margin: 1em 0;
            }
            .task-content-view ol {
              list-style-type: decimal;
              padding-left: 1.5em;
              margin: 1em 0;
            }
            .task-content-view blockquote {
              border-left: 4px solid #e2e8f0;
              padding-left: 1em;
              color: #64748b;
              font-style: italic;
            }
          `}</style>
        </div>
      </div>

      {/* 보기 모드 하단 바 */}
      <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center px-12">
        <button 
          onClick={() => onDelete(task.id)}
          className="text-xs font-bold text-rose-400 hover:text-rose-600 transition-colors"
        >
          작업 삭제하기
        </button>
        <div className="flex gap-3">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500">닫기</button>
          {task.status !== 'done' && (
            <button 
              onClick={() => onStatusChange(task.id, 'done')}
              className="px-6 py-2.5 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
            >
              완료 처리
            </button>
          )}
        </div>
      </div>
    </>
  );
}