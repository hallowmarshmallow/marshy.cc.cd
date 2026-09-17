/**
 * BackendAdapter: the only seam between features and a provider.
 * Features import this interface and never touch a provider SDK directly,
 * so swapping providers only changes src/services.
 */
import type {
  AuthProvider,
  FollowCounts,
  Post,
  Profile,
  ProjectEntry,
  ReactionType,
  SessionInfo,
  Visibility,
} from "../types/domain";
import type { ErrorCode } from "./errors";

export interface SignUpInput {
  email: string;
  password: string;
  handle: string;
  inviteCode: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface CreatePostInput {
  body: string;
  visibility?: Visibility;
}

export interface AuthAdapter {
  /** Returns null when not signed in. */
  getSession(): Promise<SessionInfo | null>;
  signUp(input: SignUpInput): Promise<void>;
  signIn(input: SignInInput): Promise<void>;
  signInWithOAuth(provider: Exclude<AuthProvider, "email">): Promise<void>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
}

export interface ProfileAdapter {
  getOwn(): Promise<Profile | null>;
  getByHandle(handle: string): Promise<Profile | null>;
  updateOwn(
    patch: Partial<
      Pick<
        Profile,
        | "displayName"
        | "bio"
        | "customStatus"
        | "avatarUrl"
        | "bannerUrl"
        | "presence"
      >
    >,
  ): Promise<Profile>;
}

/**
 * Social graph: one-way follows for now; mutual friendships arrive as a
 * separate table later. Server-side RLS enforces that follow edges can only
 * be created or deleted by their owner.
 */
export interface SocialAdapter {
  /** Followers + following counts for one member profile. */
  getFollowCounts(userId: string): Promise<FollowCounts>;
  /** Whether `followerId` currently follows `followeeId`. */
  isFollowing(followerId: string, followeeId: string): Promise<boolean>;
  /** The signed-in user starts following `targetUserId`. */
  follow(targetUserId: string): Promise<void>;
  /** The signed-in user stops following `targetUserId`. */
  unfollow(targetUserId: string): Promise<void>;
}

/**
 * Posts and feed: reverse-chronological, respecting RLS. Reactions are
 * registry-driven, with counts maintained atomically by a trigger.
 */
export interface PostsAdapter {
  /** List feed posts in reverse chronological order. */
  listFeed(options?: { limit?: number }): Promise<Post[]>;
  /** List posts by a specific user (for profile page). */
  listByAuthor(authorId: string, options?: { limit?: number }): Promise<Post[]>;
  /** Create a post (1-2000 chars, public or friends). */
  create(input: CreatePostInput): Promise<Post>;
  /** Soft-delete or remove a post. Author or moderator only. */
  delete(postId: string): Promise<void>;
  /** Toggle reaction on a post for the authenticated user. */
  toggleReaction(
    postId: string,
    reactionType: string,
  ): Promise<{ reacted: boolean }>;
  /** Active reaction types from the registry. */
  getReactionTypes(): Promise<ReactionType[]>;
}

export interface ProjectInput {
  title: string;
  description?: string;
  /** Repository as "owner/name" on GitHub. */
  repo?: string;
  imageUrl?: string | null;
  sort?: number;
  published?: boolean;
}

/**
 * Portfolio projects. Reads are public for published rows; every write is
 * restricted to the owner by RLS.
 */
export interface ProjectsAdapter {
  /** Published projects for the landing page, in display order. */
  listPublished(): Promise<ProjectEntry[]>;
  /** Every project, including unpublished drafts. Owner only. */
  listAll(): Promise<ProjectEntry[]>;
  create(input: ProjectInput): Promise<ProjectEntry>;
  update(id: string, patch: Partial<ProjectInput>): Promise<ProjectEntry>;
  remove(id: string): Promise<void>;
}

/** Role checks. RLS remains the authority; this only drives the UI. */
export interface RolesAdapter {
  /** Whether the signed-in user holds the owner role. */
  isOwner(): Promise<boolean>;
}

/** Image storage for owner-managed content. RLS restricts uploads to the owner. */
export interface StorageAdapter {
  /** Uploads an image and resolves to its public URL. */
  uploadImage(file: File): Promise<string>;
}

export interface BackendAdapter {
  readonly name: string;
  readonly auth: AuthAdapter;
  readonly profiles: ProfileAdapter;
  readonly social: SocialAdapter;
  readonly posts: PostsAdapter;
  readonly projects: ProjectsAdapter;
  readonly roles: RolesAdapter;
  readonly storage: StorageAdapter;
}

/** Thrown (as BackendError) by the placeholder adapter until a provider is configured. */
export const UNCONFIGURED_CODE: ErrorCode = "provider_error";
export const UNCONFIGURED_MESSAGE =
  "The backend is not configured yet. Add your Supabase URL and anon key to .env (see .env.example) and restart the dev server.";
