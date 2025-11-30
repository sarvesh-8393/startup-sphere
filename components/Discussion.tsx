"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "next-auth/react";
import { MessageSquare, TrendingUp, Clock, ArrowBigUp, ArrowBigDown, Reply, Crown } from "lucide-react";

interface Profile {
  full_name?: string;
  avatar_url?: string;
  email?: string;
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
  comment_votes: CommentVote[];
}

interface ProfileData {
  id: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
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

interface CommentItemProps {
  comment: Comment;
  currentUserId: string | null;
  founderId: string | null;
  replyTo: string | null;
  replyContent: string;
  setReplyTo: (id: string | null) => void;
  setReplyContent: (content: string) => void;
  postComment: (parentId: string | null) => void;
  vote: (commentId: string, type: 1 | -1) => void;
  getTimeAgo: (dateString: string) => string;
  depth?: number;
}

function CommentItem({
  comment,
  currentUserId,
  founderId,
  replyTo,
  replyContent,
  setReplyTo,
  setReplyContent,
  postComment,
  vote,
  getTimeAgo,
  depth = 0
}: CommentItemProps) {
  const isTopLevel = depth === 0;
  const avatarSize = isTopLevel ? "w-8 h-8" : "w-6 h-6";
  const textSize = isTopLevel ? "text-sm" : "text-xs";
  const marginLeft = depth > 0 ? `ml-${Math.min(depth * 10, 20)}` : "";
  const borderColors = ["border-gray-100", "border-blue-200", "border-green-200", "border-yellow-200", "border-red-200"];
  const borderLeft = depth > 0 ? `border-l-2 ${borderColors[depth % borderColors.length]} pl-3` : "";
  const isFounder = comment.user_id === founderId;

  return (
    <div className={`${marginLeft} ${borderLeft} ${depth > 0 ? 'mt-2' : ''}`}>
      <div className={`bg-white rounded-2xl border ${isFounder ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-white' : 'border-gray-200'} p-3 ${isTopLevel ? '' : 'border-gray-100'}`}>
        {/* Comment Header */}
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 relative">
            {comment.profiles?.avatar_url ? (
              <Image
                src={comment.profiles.avatar_url}
                alt={comment.profiles.full_name || comment.profiles.email || "User"}
                width={isTopLevel ? 32 : 24}
                height={isTopLevel ? 32 : 24}
                className={`${avatarSize} rounded-full object-cover ${isFounder ? 'ring-2 ring-yellow-400' : ''}`}
              />
            ) : (
              <div className={`${avatarSize} rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white ${isTopLevel ? 'text-sm' : 'text-xs'} font-semibold ${isFounder ? 'ring-2 ring-yellow-400' : ''}`}>
                {(comment.profiles?.full_name || comment.profiles?.email || 'A')[0]}
              </div>
            )}
            {isFounder && (
              <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5">
                <Crown className="w-3 h-3 text-white" fill="currentColor" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className={`flex items-center gap-2 mb-1`}>
              <span className={`font-semibold ${textSize} text-gray-900`}>
                {comment.profiles?.full_name || comment.profiles?.email || "Anon"}
              </span>
              {isFounder && (
                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-200">
                  Founder
                </span>
              )}
              <span className="text-gray-400 text-xs">·</span>
              <span className="text-gray-500 text-xs">
                {getTimeAgo(comment.created_at)}
              </span>
            </div>

            <p className={`text-gray-700 ${textSize} leading-relaxed mb-2`}>
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

        {/* Recursive Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                founderId={founderId}
                replyTo={replyTo}
                replyContent={replyContent}
                setReplyTo={setReplyTo}
                setReplyContent={setReplyContent}
                postComment={postComment}
                vote={vote}
                getTimeAgo={getTimeAgo}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Discussion({ startupId }: { startupId: string }) {
  const { data: session, status } = useSession();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [founderId, setFounderId] = useState<string | null>(null);

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

  // Fetch founder id
  useEffect(() => {
    const fetchFounder = async () => {
      if (!startupId) return;

      const { data, error } = await supabase
        .from("startups")
        .select("founder_id")
        .eq("id", startupId)
        .single();

      if (!error && data) {
        setFounderId(data.founder_id);
      }
    };

    fetchFounder();
  }, [startupId]);

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
        comment_votes(vote_type, user_id)
      `)
      .eq("startup_id", startupId);

    if (error) {
      console.error("Error fetching comments:", JSON.stringify(error));
      return;
    }

    // Get unique user IDs
    const userIds = [...new Set((data as CommentData[]).map(c => c.user_id))];

    // Fetch profiles for these user IDs
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, email")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", JSON.stringify(profilesError));
    }

    const profileMap: Record<string, Profile> = {};
    if (profilesData) {
      profilesData.forEach((p: ProfileData) => {
        profileMap[p.id] = p;
      });
    }

    const commentMap: Record<string, Comment> = {};

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
        profiles: profileMap[c.user_id] || null,
        votes,
        user_vote,
        replies: [],
      };
    });

    // Build the full recursive tree
    const buildCommentTree = (parentId: string | null): Comment[] => {
      const children = Object.values(commentMap).filter(comment => comment.parent_id === parentId);
      return children.map(comment => ({
        ...comment,
        replies: buildCommentTree(comment.id),
      }));
    };

    const topLevelComments = buildCommentTree(null);

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
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            founderId={founderId}
            replyTo={replyTo}
            replyContent={replyContent}
            setReplyTo={setReplyTo}
            setReplyContent={setReplyContent}
            postComment={postComment}
            vote={vote}
            getTimeAgo={getTimeAgo}
          />
        ))}
      </div>
    </div>
  );
}