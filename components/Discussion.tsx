"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "next-auth/react";
import { MessageSquare, TrendingUp, Clock, ArrowBigUp, ArrowBigDown, Reply } from "lucide-react";

interface Profile {
  full_name?: string;
  avatar_url?: string;
}

interface CommentVote {
  vote_type: number;
  user_id: string;
}

interface CommentData {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profiles: Profile[];
  comment_votes: CommentVote[];
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profiles: Profile | null;
  votes: number;
  user_vote: number;
  replies?: Comment[];
}

type SortType = "top" | "newest";

export default function Discussion({ startupId }: { startupId: string }) {
  const { data: session, status } = useSession();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sortType, setSortType] = useState<SortType>("top");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Fetch current user profile id
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (session?.user?.email) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", session.user.email)
          .single();

        if (!error && data) {
          setCurrentUserId(data.id);
        }
      } else {
        setCurrentUserId(null);
      }
    };

    fetchCurrentUser();
  }, [session]);

  // Fetch comments and votes
  const fetchComments = useCallback(async () => {
    if (!startupId) return;

    const { data, error } = await supabase
      .from("comments")
      .select(`
        id,
        content,
        created_at,
        user_id,
        parent_id,
        profiles(full_name, avatar_url),
        comment_votes(vote_type, user_id)
      `)
      .eq("startup_id", startupId);

    if (error) {
      console.error("Error fetching comments:", JSON.stringify(error));
      return;
    }

    const commentMap: Record<string, Comment> = {};
    const topLevelComments: Comment[] = [];

    (data as CommentData[]).forEach((c) => {
      const votes = c.comment_votes.reduce((acc: number, v: CommentVote) => acc + v.vote_type, 0);
      const userVoteObj = c.comment_votes.find((v: CommentVote) => v.user_id === currentUserId);
      const user_vote = userVoteObj ? userVoteObj.vote_type : 0;

      commentMap[c.id] = {
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user_id: c.user_id,
        parent_id: c.parent_id,
        profiles: c.profiles ? c.profiles[0] : null,
        votes,
        user_vote,
        replies: [],
      };
    });

    Object.values(commentMap).forEach((comment) => {
      if (comment.parent_id) {
        const parent = commentMap[comment.parent_id];
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(comment);
        }
      }
    });

    Object.values(commentMap).forEach((comment) => {
      if (!comment.parent_id) {
        topLevelComments.push(comment);
      }
    });

    const sortedComments = sortComments(topLevelComments, sortType);
    setComments(sortedComments);
  }, [startupId, currentUserId, sortType]);

  function sortComments(comments: Comment[], sort: SortType): Comment[] {
    const sorted = [...comments];
    if (sort === "top") {
      sorted.sort((a, b) => b.votes - a.votes || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return sorted;
  }

  async function postComment(parentId: string | null = null) {
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;
    if (!currentUserId) {
      alert("You must be logged in to comment.");
      return;
    }

    const { error } = await supabase.from("comments").insert([
      {
        content,
        startup_id: startupId,
        user_id: currentUserId,
        parent_id: parentId,
      },
    ]);

    if (!error) {
      if (parentId) {
        setReplyContent("");
        setReplyTo(null);
      } else {
        setNewComment("");
      }
      fetchComments();
    } else {
      console.error("Error posting comment:", error);
    }
  }

  async function vote(commentId: string, type: 1 | -1) {
    if (!currentUserId) {
      alert("You must be logged in to vote.");
      return;
    }

    if (!commentId) {
      console.error("Error voting: Invalid comment ID");
      return;
    }

    const existingVote = comments
      .flatMap((c) => [c, ...(c.replies || [])])
      .find((c) => c.id === commentId)?.user_vote;

    if (existingVote === type) {
      const { error } = await supabase
        .from("comment_votes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", currentUserId);
      if (error) {
        console.error("Error removing vote:", JSON.stringify(error));
      }
    } else {
      const existingVoteObj = comments
        .flatMap((c) => [c, ...(c.replies || [])])
        .find((c) => c.id === commentId);

      if (existingVoteObj && existingVoteObj.user_vote !== 0 && existingVoteObj.user_vote !== type) {
        const { error: deleteError } = await supabase
          .from("comment_votes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", currentUserId);
        if (deleteError) {
          console.error("Error deleting existing vote before upsert:", JSON.stringify(deleteError));
          return;
        }
      }

      const { error } = await supabase.from("comment_votes").upsert({
        comment_id: commentId,
        user_id: currentUserId,
        vote_type: type,
      });
      if (error) {
        console.error("Error voting:", JSON.stringify(error));
      }
    }
    fetchComments();
  }

  useEffect(() => {
    fetchComments();

    const commentsChannel = supabase
      .channel("comments-changes-" + startupId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `startup_id=eq.${startupId}` },
        () => {
          fetchComments();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comment_votes" },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
    };
  }, [fetchComments, startupId]);

  const getTimeAgo = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="mt-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-pink-600" />
          <h2 className="text-xl font-semibold">Discussion</h2>
          <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
            {comments.length}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
              sortType === "top"
                ? "bg-pink-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setSortType("top")}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Top
          </button>
          <button
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
              sortType === "newest"
                ? "bg-pink-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setSortType("newest")}
          >
            <Clock className="w-3.5 h-3.5" />
            Newest
          </button>
        </div>
      </div>

      {/* New Comment Input */}
      {currentUserId ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-3 mb-4">
          <input
            type="text"
            className="w-full border-0 focus:outline-none text-gray-900 placeholder-gray-400"
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") postComment(null);
            }}
          />
          <div className="flex justify-end mt-2">
            <button
              className="bg-pink-600 text-white px-4 py-1.5 rounded-lg hover:bg-pink-700 transition text-sm font-medium disabled:opacity-50"
              onClick={() => postComment(null)}
              disabled={!newComment.trim()}
            >
              Post
            </button>
          </div>
        </div>
      ) : (
        <p className="mb-4 text-gray-500 text-sm">Please log in to comment and vote.</p>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 && (
          <div className="text-center py-8 bg-white rounded-2xl border border-gray-200">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
          </div>
        )}

        {comments.map((comment) => (
          <div key={comment.id} className="bg-white rounded-2xl border border-gray-200 p-3">
            {/* Comment Header */}
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0">
                {comment.profiles?.avatar_url ? (
                  <img
                    src={comment.profiles.avatar_url}
                    alt={comment.profiles.full_name || "User"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                    {comment.profiles?.full_name?.[0] || 'A'}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-gray-900">
                    {comment.profiles?.full_name || "Anon"}
                  </span>
                  <span className="text-gray-400 text-xs">·</span>
                  <span className="text-gray-500 text-xs">
                    {getTimeAgo(comment.created_at)}
                  </span>
                </div>
                
                <p className="text-gray-700 text-sm leading-relaxed mb-2">
                  {comment.content}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5 bg-gray-50 rounded px-1.5 py-0.5">
                    <button
                      aria-label="Upvote"
                      className={`p-0.5 rounded transition-colors ${
                        comment.user_vote === 1 
                          ? "text-pink-600" 
                          : "text-gray-400 hover:text-pink-600"
                      }`}
                      onClick={() => vote(comment.id, 1)}
                    >
                      <ArrowBigUp className="w-4 h-4" fill={comment.user_vote === 1 ? "currentColor" : "none"} />
                    </button>
                    <span className={`text-xs font-semibold min-w-[1.5rem] text-center ${
                      comment.votes > 0 ? "text-pink-600" : comment.votes < 0 ? "text-gray-500" : "text-gray-600"
                    }`}>
                      {comment.votes}
                    </span>
                    <button
                      aria-label="Downvote"
                      className={`p-0.5 rounded transition-colors ${
                        comment.user_vote === -1 
                          ? "text-gray-600" 
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                      onClick={() => vote(comment.id, -1)}
                    >
                      <ArrowBigDown className="w-4 h-4" fill={comment.user_vote === -1 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  
                  {currentUserId && (
                    <button
                      className="flex items-center gap-1 px-2 py-0.5 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded transition-colors text-xs font-medium"
                      onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    >
                      <Reply className="w-3 h-3" />
                      Reply
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Reply Input */}
            {replyTo === comment.id && currentUserId && (
              <div className="mt-2 ml-10 bg-gray-50 rounded-xl p-2">
                <input
                  type="text"
                  className="w-full bg-transparent border-0 focus:outline-none text-gray-900 placeholder-gray-400 text-sm"
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") postComment(comment.id);
                  }}
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-1.5">
                  <button
                    className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded text-xs font-medium"
                    onClick={() => {
                      setReplyTo(null);
                      setReplyContent("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-3 py-1 bg-pink-600 text-white rounded hover:bg-pink-700 transition-colors text-xs font-medium disabled:opacity-50"
                    onClick={() => postComment(comment.id)}
                    disabled={!replyContent.trim()}
                  >
                    Reply
                  </button>
                </div>
              </div>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2 ml-10 pl-3 border-l-2 border-gray-100 space-y-2">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="flex items-start gap-2">
                    <div className="flex-shrink-0">
                      {reply.profiles?.avatar_url ? (
                        <img
                          src={reply.profiles.avatar_url}
                          alt={reply.profiles.full_name || "User"}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                          {reply.profiles?.full_name?.[0] || 'A'}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-semibold text-xs text-gray-900">
                          {reply.profiles?.full_name || "Anon"}
                        </span>
                        <span className="text-gray-400 text-xs">·</span>
                        <span className="text-gray-500 text-xs">
                          {getTimeAgo(reply.created_at)}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 text-xs leading-relaxed mb-1">
                        {reply.content}
                      </p>

                      <div className="flex items-center gap-0.5 bg-gray-50 rounded px-1 py-0.5 w-fit">
                        <button
                          aria-label="Upvote"
                          className={`p-0.5 rounded transition-colors ${
                            reply.user_vote === 1 
                              ? "text-pink-600" 
                              : "text-gray-400 hover:text-pink-600"
                          }`}
                          onClick={() => vote(reply.id, 1)}
                        >
                          <ArrowBigUp className="w-3 h-3" fill={reply.user_vote === 1 ? "currentColor" : "none"} />
                        </button>
                        <span className={`text-xs font-semibold min-w-[1rem] text-center ${
                          reply.votes > 0 ? "text-pink-600" : "text-gray-600"
                        }`}>
                          {reply.votes}
                        </span>
                        <button
                          aria-label="Downvote"
                          className={`p-0.5 rounded transition-colors ${
                            reply.user_vote === -1 
                              ? "text-gray-600" 
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                          onClick={() => vote(reply.id, -1)}
                        >
                          <ArrowBigDown className="w-3 h-3" fill={reply.user_vote === -1 ? "currentColor" : "none"} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}