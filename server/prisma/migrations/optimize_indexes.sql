-- Performance optimization indexes for production

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON "User"(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON "User"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_users_verified ON "User"("emailVerified");

-- Session table indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON "Session"("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON "Session"("expiresAt");
CREATE INDEX IF NOT EXISTS idx_sessions_token ON "Session"(token);

-- Paper table indexes
CREATE INDEX IF NOT EXISTS idx_papers_academic_area ON "Paper"("academicArea");
CREATE INDEX IF NOT EXISTS idx_papers_is_free ON "Paper"("isFree");
CREATE INDEX IF NOT EXISTS idx_papers_status ON "Paper"(status);
CREATE INDEX IF NOT EXISTS idx_papers_price ON "Paper"(price);
CREATE INDEX IF NOT EXISTS idx_papers_created_at ON "Paper"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_papers_search ON "Paper" USING gin(to_tsvector('portuguese', title || ' ' || description));

-- Course table indexes
CREATE INDEX IF NOT EXISTS idx_courses_academic_area ON "Course"("academicArea");
CREATE INDEX IF NOT EXISTS idx_courses_level ON "Course"(level);
CREATE INDEX IF NOT EXISTS idx_courses_status ON "Course"(status);
CREATE INDEX IF NOT EXISTS idx_courses_price ON "Course"(price);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON "Course"(instructor);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON "Course"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_courses_search ON "Course" USING gin(to_tsvector('portuguese', title || ' ' || description || ' ' || instructor));

-- Ebook table indexes
CREATE INDEX IF NOT EXISTS idx_ebooks_academic_area ON "Ebook"("academicArea");
CREATE INDEX IF NOT EXISTS idx_ebooks_price ON "Ebook"(price);
CREATE INDEX IF NOT EXISTS idx_ebooks_author ON "Ebook"(author);
CREATE INDEX IF NOT EXISTS idx_ebooks_created_at ON "Ebook"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_ebooks_search ON "Ebook" USING gin(to_tsvector('portuguese', title || ' ' || description || ' ' || author));

-- Order table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON "Order"("userId");
CREATE INDEX IF NOT EXISTS idx_orders_status ON "Order"(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON "Order"("paymentStatus");
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON "Order"("paymentMethod");
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON "Order"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_orders_total ON "Order"(total);

-- OrderItem table indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS idx_order_items_product_type ON "OrderItem"("productType");
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON "OrderItem"("productId");

-- Enrollment table indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON "Enrollment"("userId");
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON "Enrollment"("courseId");
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON "Enrollment"(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_completed_at ON "Enrollment"("completedAt");
CREATE INDEX IF NOT EXISTS idx_enrollments_progress ON "Enrollment"(progress);

-- Certificate table indexes
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON "Certificate"("userId");
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON "Certificate"("courseId");
CREATE INDEX IF NOT EXISTS idx_certificates_number ON "Certificate"("certificateNumber");
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON "Certificate"("issuedAt" DESC);

-- LibraryAccess table indexes
CREATE INDEX IF NOT EXISTS idx_library_access_user_id ON "LibraryAccess"("userId");
CREATE INDEX IF NOT EXISTS idx_library_access_product_type ON "LibraryAccess"("productType");
CREATE INDEX IF NOT EXISTS idx_library_access_product_id ON "LibraryAccess"("productId");
CREATE INDEX IF NOT EXISTS idx_library_access_expires_at ON "LibraryAccess"("expiresAt");

-- BlogPost table indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON "BlogPost"(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON "BlogPost"("authorId");
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON "BlogPost"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_views ON "BlogPost"(views DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_search ON "BlogPost" USING gin(to_tsvector('portuguese', title || ' ' || content || ' ' || excerpt));

-- CollaboratorApplication table indexes
CREATE INDEX IF NOT EXISTS idx_collaborator_apps_status ON "CollaboratorApplication"(status);
CREATE INDEX IF NOT EXISTS idx_collaborator_apps_area ON "CollaboratorApplication"(area);
CREATE INDEX IF NOT EXISTS idx_collaborator_apps_created_at ON "CollaboratorApplication"("createdAt" DESC);

-- ContactMessage table indexes
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON "ContactMessage"(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON "ContactMessage"("createdAt" DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON "Order"("userId", status);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON "Enrollment"("userId", "courseId");
CREATE INDEX IF NOT EXISTS idx_library_user_product ON "LibraryAccess"("userId", "productType", "productId");
CREATE INDEX IF NOT EXISTS idx_certificates_user_course ON "Certificate"("userId", "courseId");

-- Partial indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_pending ON "Order"(status) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_orders_processing ON "Order"(status) WHERE status = 'PROCESSING';
CREATE INDEX IF NOT EXISTS idx_enrollments_active ON "Enrollment"(status) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_true ON "BlogPost"(published, "createdAt" DESC) WHERE published = true;

-- Function-based indexes
CREATE INDEX IF NOT EXISTS idx_users_lower_email ON "User"(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_papers_title_lower ON "Paper"(LOWER(title));
CREATE INDEX IF NOT EXISTS idx_courses_title_lower ON "Course"(LOWER(title));

-- Statistics update for query planner
ANALYZE "User";
ANALYZE "Paper";
ANALYZE "Course";
ANALYZE "Ebook";
ANALYZE "Order";
ANALYZE "OrderItem";
ANALYZE "Enrollment";
ANALYZE "Certificate";
ANALYZE "LibraryAccess";
ANALYZE "BlogPost";
ANALYZE "CollaboratorApplication";
ANALYZE "ContactMessage";

-- Vacuum for space reclamation (run periodically)
-- VACUUM ANALYZE;

-- Query to check index usage (run in production to monitor)
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;