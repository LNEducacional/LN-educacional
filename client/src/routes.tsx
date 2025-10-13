import { LazyWrapper } from '@/components/lazy-wrapper';
import LoadingSpinner from '@/components/loading-spinner';
import { MainLayout } from '@/components/main-layout';
import { AdminRoute, PrivateRoute } from '@/components/private-route';
import { ProgressiveHydration } from '@/components/progressive-hydration';
import { Route, Routes } from 'react-router-dom';

// Import lazy routes
import {
  AddBlogPostPage,
  AddCoursePage,
  AddCustomPaperPage,
  AddEbookPage,
  AddFreePaperPage,
  AddReadyPaperPage,
  AdminAnalyticsDownloads,
  AdminBlogPosts,
  AdminCollaborators,
  AdminCourses,
  AdminCustomPaperDetails,
  AdminCustomPapers,
  EditCustomPaperPage,
  AdminDashboard,
  AdminUsersPage,
  UserDetailsPage,
  AddUserPage,
  EditUserPage,
  AdminEbooks,
  AdminFreePapers,
  AdminMessages,
  AdminOrders,
  AdminPapers,
  BlogPage,
  BlogPostPage,
  BlogPostDetailsPage,
  CheckoutPage,
  CollaboratorPage,
  CollaboratorPortalDashboard,
  CollaboratorPortalStatus,
  CollaboratorPortalDocuments,
  ContactPage,
  CourseDetailPage,
  CourseDetailsPageAdmin,
  CoursesPage,
  CustomPapersPage,
  EbookDetailPage,
  EbookDetailsPage,
  EbooksPage,
  EditBlogPostPage,
  EditCoursePage,
  EditEbookPage,
  EditFreePaperPage,
  EditReadyPaperPage,
  ForgotPasswordPage,
  FreePaperDetailPage,
  FreePaperDetailsPage,
  FreePapersPage,
  HomePage,
  LoginPage,
  NotFoundPage,
  OrderDetailsPage,
  ReadyPaperDetailsPage,
  ReadyPapersPage,
  RegisterPage,
  StudentCoursePlayerPage,
  StudentPage,
  StudentLayout,
  StudentDashboardPage,
  StudentCoursesPage,
  StudentOrdersPage,
  StudentLibraryPage,
  StudentCustomPapersPage,
  StudentCertificatesPage,
  StudentProfilePage,
  StudentDownloadsPage,
} from '@/routes/lazy-routes';

export default function AppRoutes() {
  return (
    <ProgressiveHydration priority="high">
      <Routes>
        {/* Public Routes with High Priority */}
        <Route
          path="/"
          element={<LazyWrapper component={HomePage} fallback={<LoadingSpinner />} />}
        />
        <Route
          path="/login"
          element={<LazyWrapper component={LoginPage} fallback={<LoadingSpinner />} />}
        />
        <Route
          path="/register"
          element={<LazyWrapper component={RegisterPage} fallback={<LoadingSpinner />} />}
        />
        <Route
          path="/forgot-password"
          element={<LazyWrapper component={ForgotPasswordPage} fallback={<LoadingSpinner />} />}
        />

        {/* Protected Student Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<LazyWrapper component={StudentLayout} fallback={<LoadingSpinner />} />}>
            <Route
              path="/dashboard"
              element={<LazyWrapper component={StudentDashboardPage} fallback={<LoadingSpinner />} />}
            />
            <Route
              path="/student"
              element={<LazyWrapper component={StudentDashboardPage} fallback={<LoadingSpinner />} />}
            />
            <Route
              path="/student/courses"
              element={<LazyWrapper component={StudentCoursesPage} fallback={<LoadingSpinner />} />}
            />
            <Route
              path="/student/orders"
              element={<LazyWrapper component={StudentOrdersPage} fallback={<LoadingSpinner />} />}
            />
            <Route
              path="/student/library"
              element={<LazyWrapper component={StudentLibraryPage} fallback={<LoadingSpinner />} />}
            />
            <Route
              path="/student/custom-papers"
              element={<LazyWrapper component={StudentCustomPapersPage} fallback={<LoadingSpinner />} />}
            />
            <Route
              path="/student/certificates"
              element={<LazyWrapper component={StudentCertificatesPage} fallback={<LoadingSpinner />} />}
            />
            <Route
              path="/student/profile"
              element={<LazyWrapper component={StudentProfilePage} fallback={<LoadingSpinner />} />}
            />
            <Route
              path="/student/downloads"
              element={<LazyWrapper component={StudentDownloadsPage} fallback={<LoadingSpinner />} />}
            />
          </Route>
          <Route
            path="/student/courses/:courseId"
            element={
              <LazyWrapper component={StudentCoursePlayerPage} fallback={<LoadingSpinner />} />
            }
          />
          <Route
            path="/checkout"
            element={
              <MainLayout>
                <LazyWrapper component={CheckoutPage} fallback={<LoadingSpinner />} />
              </MainLayout>
            }
          />
          <Route
            path="/collaborator/portal"
            element={
              <MainLayout>
                <LazyWrapper component={CollaboratorPortalDashboard} fallback={<LoadingSpinner />} />
              </MainLayout>
            }
          />
          <Route
            path="/collaborator/portal/status"
            element={
              <MainLayout>
                <LazyWrapper component={CollaboratorPortalStatus} fallback={<LoadingSpinner />} />
              </MainLayout>
            }
          />
          <Route
            path="/collaborator/portal/documents"
            element={
              <MainLayout>
                <LazyWrapper component={CollaboratorPortalDocuments} fallback={<LoadingSpinner />} />
              </MainLayout>
            }
          />
        </Route>

        {/* Protected Admin Routes with Medium Priority */}
        <Route element={<AdminRoute />}>
          <Route
            path="/admin"
            element={
              <ProgressiveHydration priority="medium">
                <LazyWrapper component={AdminDashboard} fallback={<LoadingSpinner />} />
              </ProgressiveHydration>
            }
          />
          <Route
            path="/admin/notifications"
            element={<LazyWrapper component={AdminDashboard} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/ready-papers"
            element={<LazyWrapper component={AdminPapers} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/ready-papers/add"
            element={<LazyWrapper component={AddReadyPaperPage} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/ready-papers/edit/:id"
            element={<LazyWrapper component={EditReadyPaperPage} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/ready-papers/details/:id"
            element={
              <LazyWrapper component={ReadyPaperDetailsPage} fallback={<LoadingSpinner />} />
            }
          />
          <Route
            path="/admin/free-papers"
            element={<LazyWrapper component={AdminFreePapers} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/free-papers/add"
            element={<LazyWrapper component={AddFreePaperPage} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/free-papers/edit/:id"
            element={<LazyWrapper component={EditFreePaperPage} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/free-papers/:id"
            element={<LazyWrapper component={FreePaperDetailsPage} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/ebooks"
            element={<LazyWrapper component={AdminEbooks} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/ebooks/add"
            element={<LazyWrapper component={AddEbookPage} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/ebooks/edit/:id"
            element={<LazyWrapper component={EditEbookPage} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/ebooks/:id"
            element={<LazyWrapper component={EbookDetailsPage} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/cursos"
            element={<LazyWrapper component={AdminCourses} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/cursos/adicionar"
            element={<LazyWrapper component={AddCoursePage} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/cursos/editar/:id"
            element={<LazyWrapper component={EditCoursePage} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/cursos/detalhes/:id"
            element={
              <LazyWrapper component={CourseDetailsPageAdmin} fallback={<LoadingSpinner />} />
            }
          />
          <Route
            path="/admin/blog-posts"
            element={<LazyWrapper component={AdminBlogPosts} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/blog-posts/adicionar"
            element={<LazyWrapper component={AddBlogPostPage} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/blog-posts/editar/:id"
            element={<LazyWrapper component={EditBlogPostPage} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/blog-posts/:id"
            element={<LazyWrapper component={BlogPostDetailsPage} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/pedidos"
            element={<LazyWrapper component={AdminOrders} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/pedidos/:id"
            element={<LazyWrapper component={OrderDetailsPage} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/mensagens"
            element={<LazyWrapper component={AdminMessages} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/colaboradores"
            element={<LazyWrapper component={AdminCollaborators} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/analytics/downloads"
            element={
              <LazyWrapper component={AdminAnalyticsDownloads} fallback={<LoadingSpinner />} />
            }
          />
          <Route
            path="/admin/downloads"
            element={
              <LazyWrapper component={AdminAnalyticsDownloads} fallback={<LoadingSpinner />} />
            }
          />
          <Route
            path="/admin/custom-papers"
            element={<LazyWrapper component={AdminCustomPapers} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/custom-papers/adicionar"
            element={<LazyWrapper component={AddCustomPaperPage} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/custom-papers/edit/:id"
            element={
              <LazyWrapper component={EditCustomPaperPage} fallback={<LoadingSpinner />} />
            }
          />
          <Route
            path="/admin/custom-papers/:id"
            element={
              <LazyWrapper component={AdminCustomPaperDetails} fallback={<LoadingSpinner />} />
            }
          />
          <Route
            path="/admin/usuarios"
            element={<LazyWrapper component={AdminUsersPage} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/usuarios/:id"
            element={<LazyWrapper component={UserDetailsPage} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/usuarios/adicionar"
            element={<LazyWrapper component={AddUserPage} fallback={<LoadingSpinner />} />}
          />
          <Route
            path="/admin/usuarios/:id/editar"
            element={<LazyWrapper component={EditUserPage} fallback={<LoadingSpinner />} />}
          />
        </Route>

        {/* Public Product Routes with Medium Priority */}
        <Route
          path="/ready-papers"
          element={
            <MainLayout>
              <ProgressiveHydration priority="medium">
                <LazyWrapper component={ReadyPapersPage} fallback={<LoadingSpinner />} />
              </ProgressiveHydration>
            </MainLayout>
          }
        />
        <Route
          path="/ready-papers/:id"
          element={
            <MainLayout>
              <LazyWrapper component={ReadyPapersPage} fallback={<LoadingSpinner />} />
            </MainLayout>
          }
        />
        <Route
          path="/free-papers"
          element={
            <MainLayout>
              <LazyWrapper component={FreePapersPage} fallback={<LoadingSpinner />} />
            </MainLayout>
          }
        />
        <Route
          path="/free-papers/:id"
          element={
            <MainLayout>
              <LazyWrapper component={FreePaperDetailPage} fallback={<LoadingSpinner />} />
            </MainLayout>
          }
        />
        <Route
          path="/custom-papers"
          element={
            <MainLayout>
              <LazyWrapper component={CustomPapersPage} fallback={<LoadingSpinner />} />
            </MainLayout>
          }
        />
        <Route
          path="/courses"
          element={
            <MainLayout>
              <LazyWrapper component={CoursesPage} fallback={<LoadingSpinner />} />
            </MainLayout>
          }
        />
        <Route
          path="/courses/:id"
          element={
            <MainLayout>
              <LazyWrapper component={CourseDetailPage} fallback={<LoadingSpinner />} />
            </MainLayout>
          }
        />
        <Route
          path="/ebooks"
          element={
            <MainLayout>
              <LazyWrapper component={EbooksPage} fallback={<LoadingSpinner />} />
            </MainLayout>
          }
        />
        <Route
          path="/ebooks/:id"
          element={
            <MainLayout>
              <LazyWrapper component={EbookDetailPage} fallback={<LoadingSpinner />} />
            </MainLayout>
          }
        />
        <Route
          path="/blog"
          element={
            <MainLayout>
              <LazyWrapper component={BlogPage} fallback={<LoadingSpinner />} />
            </MainLayout>
          }
        />
        <Route
          path="/blog/:slug"
          element={
            <MainLayout>
              <LazyWrapper component={BlogPostPage} fallback={<LoadingSpinner />} />
            </MainLayout>
          }
        />
        <Route
          path="/collaborator"
          element={
            <MainLayout>
              <ProgressiveHydration priority="low">
                <LazyWrapper component={CollaboratorPage} fallback={<LoadingSpinner />} />
              </ProgressiveHydration>
            </MainLayout>
          }
        />
        <Route
          path="/contact"
          element={
            <MainLayout>
              <ProgressiveHydration priority="low">
                <LazyWrapper component={ContactPage} fallback={<LoadingSpinner />} />
              </ProgressiveHydration>
            </MainLayout>
          }
        />

        {/* Catch-all route */}
        <Route
          path="*"
          element={<LazyWrapper component={NotFoundPage} fallback={<LoadingSpinner />} />}
        />
      </Routes>
    </ProgressiveHydration>
  );
}
