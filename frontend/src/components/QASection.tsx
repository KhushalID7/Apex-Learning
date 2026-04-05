"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  getCourseDoubts, getDoubtDetails, askDoubt, replyToDoubt, toggleDoubtStatus,
  type Doubt, type DoubtDetail
} from "@/lib/courseApi";
import { MessageSquare, Send, CheckCircle2, User, Clock, Loader2, Plus, X, ChevronLeft } from "lucide-react";
import AlertBanner from "./AlertBanner";
import Badge from "./Badge";

interface QASectionProps {
  courseId: string;
  activeLectureId?: string;
  isTeacher?: boolean;
}

export default function QASection({ courseId, activeLectureId, isTeacher = false }: QASectionProps) {
  const { session, user } = useAuth();
  
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeDoubt, setActiveDoubt] = useState<DoubtDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const [showAskForm, setShowAskForm] = useState(false);
  const [askForm, setAskForm] = useState({ title: "", description: "" });
  const [submittingAsk, setSubmittingAsk] = useState(false);
  
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    if (session?.access_token && courseId) {
      fetchDoubts();
    }
  }, [session, courseId]);

  const fetchDoubts = async () => {
    try {
      setLoading(true);
      const data = await getCourseDoubts(courseId, session!.access_token);
      setDoubts(data);
    } catch (err) {
      setError("Failed to load Q&A");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDoubt = async (doubtId: string) => {
    try {
      setLoadingDetails(true);
      setError(null);
      const data = await getDoubtDetails(doubtId, session!.access_token);
      setActiveDoubt(data);
    } catch (err) {
      setError("Failed to load doubt details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askForm.title || !askForm.description) return;
    
    try {
      setSubmittingAsk(true);
      await askDoubt(courseId, { 
        ...askForm, 
        lecture_id: activeLectureId 
      }, session!.access_token);
      
      setAskForm({ title: "", description: "" });
      setShowAskForm(false);
      await fetchDoubts();
    } catch (err) {
      setError("Failed to post question");
    } finally {
      setSubmittingAsk(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent || !activeDoubt) return;
    
    try {
      setSubmittingReply(true);
      await replyToDoubt(activeDoubt.id, replyContent, session!.access_token);
      setReplyContent("");
      // Reload details
      await handleOpenDoubt(activeDoubt.id);
      await fetchDoubts(); // Update reply count in list
    } catch (err) {
      setError("Failed to post reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleToggleStatus = async (doubtId: string) => {
    try {
      await toggleDoubtStatus(doubtId, session!.access_token);
      if (activeDoubt && activeDoubt.id === doubtId) {
        await handleOpenDoubt(doubtId);
      }
      await fetchDoubts();
    } catch (err) {
      setError("Failed to update status. You might not have permission.");
    }
  };

  if (loading && !doubts.length) {
    return <div className="p-8 text-center text-muted flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading QA...</div>;
  }

  // Thread View
  if (activeDoubt) {
    return (
      <div className="flex flex-col h-full bg-surface-2 animate-fade-in relative z-10 w-full lg:static">
        {/* Header */}
        <div className="p-4 border-b border-card-border bg-card/60 backdrop-blur-md sticky top-0 flex items-center gap-3">
          <button 
            onClick={() => setActiveDoubt(null)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 overflow-hidden">
            <h3 className="font-bold text-foreground text-sm truncate">{activeDoubt.title}</h3>
            <p className="text-xs text-muted truncate">By {activeDoubt.student_name || "Unknown"}</p>
          </div>
          {activeDoubt.status === 'resolved' && <Badge variant="success">Resolved</Badge>}
        </div>

        {/* Thread Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col">
          {error && <AlertBanner message={error} variant="error" className="mb-4" />}

          {/* Chat System Actions (Resolve) */}
          <div className="flex justify-center mb-6">
            {(isTeacher || activeDoubt.student_id === user?.id) && (
                <button
                  onClick={() => handleToggleStatus(activeDoubt.id)}
                  className={`text-[10px] uppercase tracking-wider font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${activeDoubt.status === 'resolved' ? 'border-card-border bg-surface-2 text-muted hover:text-foreground' : 'border-success/30 bg-success/10 text-success hover:bg-success/20'}`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {activeDoubt.status === 'resolved' ? "Reopen Question" : "Mark as Resolved"}
                </button>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {/* Original Post (Bubble) */}
            {(() => {
              const isMyDoubt = activeDoubt.student_id === user?.id;
              return (
                <div className={`flex flex-col ${isMyDoubt ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-2 mb-1 px-1 ${isMyDoubt ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="text-xs font-semibold text-muted">{isMyDoubt ? "You" : (activeDoubt.student_name || "Student")}</span>
                    <span className="text-[10px] text-muted/60">{new Date(activeDoubt.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${isMyDoubt ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border border-card-border rounded-tl-sm'}`}>
                    <p className={`text-sm whitespace-pre-wrap ${isMyDoubt ? 'text-white' : 'text-foreground/90'}`}>{activeDoubt.description}</p>
                    {activeDoubt.lecture_title && <div className={`mt-3 text-[10px] px-2 py-1 rounded w-fit ${isMyDoubt ? 'bg-black/20 text-white/90' : 'bg-white/5 text-accent'}`}>Lecture: {activeDoubt.lecture_title}</div>}
                  </div>
                </div>
              );
            })()}

            {/* Replies */}
            {loadingDetails ? (
              <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin text-muted" /></div>
            ) : activeDoubt.replies.length > 0 ? (
              activeDoubt.replies.map(reply => {
                 const isMe = reply.user_id === user?.id;
                 const isTeacherReply = reply.user_id !== activeDoubt.student_id;
                 
                 return (
                   <div key={reply.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`flex items-center gap-2 mb-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold ${isMe ? 'bg-primary/20 text-primary' : (isTeacherReply ? 'bg-accent/20 text-accent' : 'bg-muted/20 text-muted')}`}>
                           {reply.user_name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <span className="text-xs font-semibold text-muted">
                           {isMe ? "You" : (reply.user_name || "Unknown")} 
                           {isTeacherReply && !isMe && <span className="ml-1.5 px-1 py-0.5 rounded text-[8px] tracking-wider uppercase font-bold bg-accent/10 text-accent border border-accent/20">Teacher</span>}
                        </span>
                        <span className="text-[10px] text-muted/60">{new Date(reply.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border border-card-border rounded-tl-sm'}`}>
                         <p className={`text-sm whitespace-pre-wrap ${isMe ? 'text-white' : 'text-foreground/90'}`}>{reply.content}</p>
                      </div>
                   </div>
                 );
              })
            ) : null}
          </div>
        </div>

        {/* Reply Input */}
        <div className="p-3 bg-card border-t border-card-border">
          <form onSubmit={handleReplySubmit} className="flex items-end gap-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 input-field min-h-[44px] max-h-[120px] resize-none py-3 text-sm"
              rows={1}
            />
            <button
              type="submit"
              disabled={submittingReply || !replyContent.trim()}
              className="h-[44px] w-[44px] shrink-0 bg-primary hover:bg-primary-hover text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
            >
              {submittingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Ask Form View
  if (showAskForm) {
    return (
      <div className="flex flex-col h-full bg-surface-2 animate-fade-in relative z-10 w-full lg:static">
        <div className="p-4 border-b border-card-border bg-card/60 flex items-center justify-between">
          <h3 className="font-bold text-foreground text-sm">Ask a Question</h3>
          <button onClick={() => setShowAskForm(false)} className="text-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          {error && <AlertBanner message={error} variant="error" className="mb-4" />}
          <form onSubmit={handleAskSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Title summary</label>
              <input
                type="text"
                value={askForm.title}
                onChange={e => setAskForm(prev => ({...prev, title: e.target.value}))}
                className="input-field py-2"
                placeholder="e.g. How does React rendering work here?"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Details</label>
              <textarea
                value={askForm.description}
                onChange={e => setAskForm(prev => ({...prev, description: e.target.value}))}
                className="input-field py-2 h-32 resize-none custom-scrollbar"
                placeholder="Describe what you are stuck on..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={submittingAsk}
              className="btn-primary w-full py-2.5 flex justify-center items-center gap-2"
            >
              {submittingAsk ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Question"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="flex flex-col h-full flex-1 overflow-hidden relative">
      <div className="p-3">
        {!isTeacher && (
           <button 
             onClick={() => setShowAskForm(true)}
             className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 p-3 rounded-xl transition-colors font-semibold text-sm mb-4"
           >
             <Plus className="h-4 w-4" /> Ask a Question
           </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 pt-0 custom-scrollbar space-y-2">
        {doubts.length > 0 ? (
          doubts.map(doubt => (
            <button
              key={doubt.id}
              onClick={() => handleOpenDoubt(doubt.id)}
              className="w-full text-left p-4 rounded-xl border border-card-border bg-card/40 hover:bg-white/5 transition-colors group flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${doubt.status === 'resolved' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                  {doubt.status}
                </span>
                <span className="text-xs text-muted flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> {doubt.reply_count}
                </span>
              </div>
              <h4 className="font-bold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {doubt.title}
              </h4>
              <p className="text-xs text-muted line-clamp-1">{doubt.description}</p>
            </button>
          ))
        ) : (
          <div className="text-center p-6 border border-dashed border-card-border rounded-xl">
            <MessageSquare className="h-8 w-8 text-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-foreground">No questions yet</p>
            <p className="text-xs text-muted mt-1">Be the first to ask something!</p>
          </div>
        )}
      </div>
    </div>
  );
}
