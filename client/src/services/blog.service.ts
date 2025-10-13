import api from './api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    posts: number;
  };
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    posts: number;
  };
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImageUrl?: string;
  published: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string;
  views: number;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  categoryId?: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  tags?: {
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  _count?: {
    tags: number;
    comments: number;
    likes: number;
  };
  // SEO fields
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  readingTime?: number;
}

export interface CreateBlogPostDto {
  title: string;
  content: string;
  excerpt: string;
  coverImageUrl?: string;
  published?: boolean;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  categoryId?: string;
  tagIds?: string[];
}

export interface UpdateBlogPostDto extends Partial<CreateBlogPostDto> {}

export interface CreateCategoryDto {
  name: string;
  slug?: string;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

export interface CreateTagDto {
  name: string;
  slug?: string;
}

export interface UpdateTagDto extends Partial<CreateTagDto> {}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  userId: string;
  parentId?: string;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
  };
  post?: {
    id: string;
    title: string;
    slug: string;
  };
  parent?: {
    id: string;
    content: string;
    user: {
      name: string;
    };
  };
  replies?: Comment[];
  _count?: {
    replies: number;
  };
}

export interface CreateCommentDto {
  content: string;
  postId: string;
  parentId?: string;
}

export interface UpdateCommentDto {
  content?: string;
  approved?: boolean;
}

export interface Like {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

export interface BlogFilters {
  search?: string;
  categoryId?: string;
  tagIds?: string[];
  published?: boolean;
  skip?: number;
  take?: number;
}

export interface AdvancedSearchFilters {
  search?: string;
  categoryId?: string;
  tagIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  authorId?: string;
  published?: boolean;
  sortBy?: 'date' | 'popularity' | 'relevance' | 'views';
  sortOrder?: 'asc' | 'desc';
  skip?: number;
  take?: number;
}

class BlogService {
  // Public endpoints
  async getPublishedPosts(filters?: BlogFilters): Promise<{ posts: BlogPost[]; total: number }> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.tagIds && filters.tagIds.length > 0) {
      params.append('tagIds', filters.tagIds.join(','));
    }
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.take) params.append('take', filters.take.toString());

    params.append('published', 'true');

    const response = await api.get(`/blog?${params.toString()}`);
    return response.data;
  }

  async getPostBySlug(slug: string): Promise<BlogPost> {
    const response = await api.get(`/blog/${slug}`);
    return response.data;
  }

  // Admin endpoints
  async getAllPosts(filters?: BlogFilters): Promise<{ posts: BlogPost[]; total: number }> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.tagIds && filters.tagIds.length > 0) {
      params.append('tagIds', filters.tagIds.join(','));
    }
    if (filters?.published !== undefined) {
      params.append('published', filters.published.toString());
    }
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.take) params.append('take', filters.take.toString());

    const response = await api.get(`/admin/blog?${params.toString()}`);
    return response.data;
  }

  async getPostById(id: string): Promise<BlogPost> {
    const response = await api.get(`/admin/blog/${id}`);
    return response.data;
  }

  async createPost(data: CreateBlogPostDto): Promise<BlogPost> {
    const response = await api.post('/admin/blog', data);
    return response.data;
  }

  async updatePost(id: string, data: UpdateBlogPostDto): Promise<BlogPost> {
    const response = await api.put(`/admin/blog/${id}`, data);
    return response.data;
  }

  async deletePost(id: string): Promise<void> {
    await api.delete(`/admin/blog/${id}`);
  }

  async togglePublish(id: string): Promise<BlogPost> {
    const response = await api.patch(`/admin/blog/${id}/publish`);
    return response.data;
  }

  async uploadImage(file: File): Promise<{ url: string; size: number; mimetype: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/admin/blog/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Category endpoints
  async getCategories(filters?: { search?: string; skip?: number; take?: number }): Promise<{ categories: Category[]; total: number }> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.take) params.append('take', filters.take.toString());

    const response = await api.get(`/categories?${params.toString()}`);
    return response.data;
  }

  async getCategoryById(id: string): Promise<Category> {
    const response = await api.get(`/admin/categories/${id}`);
    return response.data;
  }

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    const response = await api.post('/admin/categories', data);
    return response.data;
  }

  async updateCategory(id: string, data: UpdateCategoryDto): Promise<Category> {
    const response = await api.put(`/admin/categories/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/admin/categories/${id}`);
  }

  // Tag endpoints
  async getTags(filters?: { search?: string; skip?: number; take?: number }): Promise<{ tags: Tag[]; total: number }> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.take) params.append('take', filters.take.toString());

    const response = await api.get(`/tags?${params.toString()}`);
    return response.data;
  }

  async getTagById(id: string): Promise<Tag> {
    const response = await api.get(`/admin/tags/${id}`);
    return response.data;
  }

  async createTag(data: CreateTagDto): Promise<Tag> {
    const response = await api.post('/admin/tags', data);
    return response.data;
  }

  async updateTag(id: string, data: UpdateTagDto): Promise<Tag> {
    const response = await api.put(`/admin/tags/${id}`, data);
    return response.data;
  }

  async deleteTag(id: string): Promise<void> {
    await api.delete(`/admin/tags/${id}`);
  }

  // Comment endpoints
  async getCommentsByPostId(postId: string): Promise<{ comments: Comment[] }> {
    const response = await api.get(`/blog/${postId}/comments`);
    return response.data;
  }

  async createComment(data: CreateCommentDto): Promise<Comment> {
    const response = await api.post('/blog/comments', data);
    return response.data;
  }

  async getAdminComments(filters?: {
    postId?: string;
    approved?: boolean;
    search?: string;
    skip?: number;
    take?: number;
  }): Promise<{ comments: Comment[]; total: number }> {
    const params = new URLSearchParams();

    if (filters?.postId) params.append('postId', filters.postId);
    if (filters?.approved !== undefined) params.append('approved', filters.approved.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.take) params.append('take', filters.take.toString());

    const response = await api.get(`/admin/comments?${params.toString()}`);
    return response.data;
  }

  async updateComment(id: string, data: UpdateCommentDto): Promise<Comment> {
    const response = await api.put(`/admin/comments/${id}`, data);
    return response.data;
  }

  async approveComment(id: string): Promise<Comment> {
    const response = await api.put(`/admin/comments/${id}/approve`);
    return response.data;
  }

  async deleteComment(id: string): Promise<void> {
    await api.delete(`/admin/comments/${id}`);
  }

  // Like endpoints
  async toggleLike(postId: string): Promise<{ liked: boolean }> {
    const response = await api.post(`/blog/${postId}/like`);
    return response.data;
  }

  async getPostLikes(postId: string): Promise<{ likes: Like[]; count: number }> {
    const response = await api.get(`/blog/${postId}/likes`);
    return response.data;
  }

  async getPostLikeCount(postId: string): Promise<{ count: number }> {
    const response = await api.get(`/blog/${postId}/likes/count`);
    return response.data;
  }

  async getUserLikeStatus(postId: string): Promise<{ liked: boolean }> {
    const response = await api.get(`/blog/${postId}/likes/status`);
    return response.data;
  }

  // Related posts
  async getRelatedPosts(postId: string, limit = 4): Promise<{ posts: BlogPost[] }> {
    const response = await api.get(`/blog/${postId}/related?limit=${limit}`);
    return response.data;
  }

  // Advanced search - Public endpoint
  async searchPosts(filters: AdvancedSearchFilters): Promise<{ posts: BlogPost[]; total: number; query: AdvancedSearchFilters }> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.tagIds && filters.tagIds.length > 0) {
      params.append('tagIds', filters.tagIds.join(','));
    }
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.authorId) params.append('authorId', filters.authorId);
    if (filters.published !== undefined) params.append('published', filters.published.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.skip) params.append('skip', filters.skip.toString());
    if (filters.take) params.append('take', filters.take.toString());

    const response = await api.get(`/blog/search?${params.toString()}`);
    return response.data;
  }

  // Advanced search - Admin endpoint
  async adminSearchPosts(filters: AdvancedSearchFilters): Promise<{ posts: BlogPost[]; total: number; query: AdvancedSearchFilters }> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.tagIds && filters.tagIds.length > 0) {
      params.append('tagIds', filters.tagIds.join(','));
    }
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.authorId) params.append('authorId', filters.authorId);
    if (filters.published !== undefined) params.append('published', filters.published.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.skip) params.append('skip', filters.skip.toString());
    if (filters.take) params.append('take', filters.take.toString());

    const response = await api.get(`/admin/blog/search?${params.toString()}`);
    return response.data;
  }
}

export default new BlogService();
