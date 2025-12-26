import { lazy } from 'react';

// Lazy load páginas principais
export const HomePage = lazy(() => import('@/pages/index'));
export const FreePapersPage = lazy(() => import('@/pages/free-papers'));
export const ReadyPapersPage = lazy(() => import('@/pages/ready-papers'));
export const CustomPapersPage = lazy(() => import('@/pages/custom-papers'));
export const CoursesPage = lazy(() => import('@/pages/online-courses'));
export const EbooksPage = lazy(() => import('@/pages/ebooks-guides'));
export const BlogPage = lazy(() => import('@/pages/blog'));
export const ContactPage = lazy(() => import('@/pages/contact'));
export const CollaboratorPage = lazy(() => import('@/pages/collaborator'));
export const TestimonialsPage = lazy(() => import('@/pages/testimonials'));
export const CollaboratorPortalDashboard = lazy(() => import('@/pages/collaborator/portal/Dashboard'));
export const CollaboratorPortalStatus = lazy(() => import('@/pages/collaborator/portal/Status'));
export const CollaboratorPortalDocuments = lazy(() => import('@/pages/collaborator/portal/Documents'));

// Lazy load páginas de autenticação
export const LoginPage = lazy(() => import('@/pages/login'));
export const RegisterPage = lazy(() => import('@/pages/register'));
export const ForgotPasswordPage = lazy(() => import('@/pages/forgot-password'));

// Lazy load páginas de estudante
export const StudentPage = lazy(() => import('@/pages/student'));
export const StudentDashboardPage = lazy(() => import('@/pages/student/student-dashboard-page'));
export const StudentCoursesPage = lazy(() => import('@/pages/student/student-courses-page'));
export const StudentOrdersPage = lazy(() => import('@/pages/student/student-orders-page'));
export const StudentLibraryPage = lazy(() => import('@/pages/student/student-library-page'));
export const StudentCustomPapersPage = lazy(() => import('@/pages/student/student-custom-papers-page'));
export const StudentCertificatesPage = lazy(() => import('@/pages/student/student-certificates-page'));
export const StudentProfilePage = lazy(() => import('@/pages/student/student-profile-page'));
export const StudentDownloadsPage = lazy(() => import('@/pages/student/student-downloads-page'));
export const StudentCoursePlayerPage = lazy(() => import('@/pages/student-course-player'));
export const CheckoutPage = lazy(() => import('@/pages/checkout'));
export const PurchaseSuccessPage = lazy(() => import('@/pages/purchase-success'));
export const StudentLayout = lazy(() => import('@/components/student/student-layout').then(m => ({ default: m.StudentLayout })));

// Lazy load páginas de detalhes
export const FreePaperDetailPage = lazy(() => import('@/pages/free-paper-detail'));
export const CourseDetailPage = lazy(() => import('@/pages/course-detail'));
export const BlogPostPage = lazy(() => import('@/pages/blog-post'));
export const EbookDetailPage = lazy(() => import('@/pages/ebook-detail'));

// Lazy load páginas admin com prefetch
export const AdminDashboard = lazy(() => import(/* webpackPreload: true */ '@/pages/admin'));
export const AdminPapers = lazy(
  () => import(/* webpackPrefetch: true */ '@/pages/admin/ready-papers-page')
);
export const AdminCourses = lazy(
  () => import(/* webpackPrefetch: true */ '@/pages/admin/courses-page')
);
export const AdminEbooks = lazy(
  () => import(/* webpackPrefetch: true */ '@/pages/admin/ebooks-page')
);
export const AdminFreePapers = lazy(
  () => import(/* webpackPrefetch: true */ '@/pages/admin/free-papers-page')
);
export const AdminBlogPosts = lazy(
  () => import(/* webpackPrefetch: true */ '@/pages/admin/blog-posts-page')
);
export const AdminOrders = lazy(
  () => import(/* webpackPrefetch: true */ '@/pages/admin/orders-page')
);
export const OrderDetailsPage = lazy(
  () => import(/* webpackPrefetch: true */ '@/pages/admin/order-details-page')
);
export const AdminCollaborators = lazy(
  () => import(/* webpackPrefetch: true */ '@/pages/admin/collaborators-page')
);
export const AdminIntegrations = lazy(
  () => import(/* webpackPrefetch: true */ '@/pages/admin/integrations-page')
);
export const AdminAnalyticsDownloads = lazy(
  () => import(/* webpackPrefetch: true */ '@/pages/admin/analytics-downloads')
);
export const AdminCustomPapers = lazy(
  () => import(/* webpackPrefetch: true */ '@/pages/admin/admin-custom-papers')
);
export const AdminCustomPaperDetails = lazy(
  () => import(/* webpackPrefetch: true */ '@/pages/admin/admin-custom-paper-details')
);
export const AdminUsersPage = lazy(
  () => import(/* webpackPrefetch: true */ '@/pages/admin/admin-users-page')
);
export const UserDetailsPage = lazy(
  () => import(/* webpackPrefetch: true */ '@/pages/admin/user-details-page')
);
export const AddUserPage = lazy(() => import('@/pages/admin/add-user-page'));
export const EditUserPage = lazy(() => import('@/pages/admin/edit-user-page'));

// Lazy load páginas de adicionar/editar admin
export const AddReadyPaperPage = lazy(() => import('@/pages/admin/add-ready-paper-page'));
export const EditReadyPaperPage = lazy(() => import('@/pages/admin/edit-ready-paper-page'));
export const ReadyPaperDetailsPage = lazy(() => import('@/pages/admin/ready-paper-details-page'));
export const AddFreePaperPage = lazy(() => import('@/pages/admin/add-free-paper-page'));
export const EditFreePaperPage = lazy(() => import('@/pages/admin/edit-free-paper-page'));
export const FreePaperDetailsPage = lazy(() => import('@/pages/admin/free-paper-details-page'));
export const AddEbookPage = lazy(() => import('@/pages/admin/add-ebook-page'));
export const EditEbookPage = lazy(() => import('@/pages/admin/edit-ebook-page'));
export const EbookDetailsPage = lazy(() => import('@/pages/admin/ebook-details-page'));
export const AddCoursePage = lazy(() => import('@/pages/admin/add-course-page'));
export const EditCoursePage = lazy(() => import('@/pages/admin/edit-course-page'));
export const CourseDetailsPageAdmin = lazy(() => import('@/pages/admin/course-details-page'));
export const AddBlogPostPage = lazy(() => import('@/pages/admin/add-blog-post-page'));
export const EditBlogPostPage = lazy(() => import('@/pages/admin/edit-blog-post-page'));
export const BlogPostDetailsPage = lazy(() => import('@/pages/admin/blog-post-details-page'));
export const AddCustomPaperPage = lazy(() => import('@/pages/admin/add-custom-paper-page'));
export const EditCustomPaperPage = lazy(() => import('@/pages/admin/edit-custom-paper-page'));
export const AdminNewsletterPage = lazy(() => import('@/pages/admin/newsletter-page'));

// Lazy load página 404
export const NotFoundPage = lazy(() => import('@/pages/not-found'));
