import { LoadingSpinner } from '@/components/loading-spinner';
import { OptimizedPaperCard } from '@/components/optimized-paper-card';
import { useStreamedData, useStreamedDataWithFallback } from '@/hooks/useStreamedData';
import { Suspense } from 'react';

// Interfaces
interface Paper {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  price: number;
}

interface LibraryItem {
  id: string;
  title: string;
  downloadUrl: string;
  type: string;
}

interface Certificate {
  id: string;
  title: string;
  issueDate: string;
  certificateUrl: string;
}

// Componente para streaming de papers
export function StreamedPapers({ papersPromise }: { papersPromise: Promise<Paper[]> }) {
  const papers = useStreamedData(() => papersPromise);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {papers.map((paper) => (
        <OptimizedPaperCard key={paper.id} paper={paper} />
      ))}
    </div>
  );
}

// Componente para streaming de cursos
export function StreamedCourses({ coursesPromise }: { coursesPromise: Promise<Course[]> }) {
  const courses = useStreamedData(() => coursesPromise);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {courses.map((course) => (
        <div key={course.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
          <p className="text-gray-600 mb-4">{course.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Por: {course.instructor}</span>
            <span className="font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(course.price)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Componente para streaming de dashboard
export function StreamedDashboard({
  metricsPromise,
}: {
  metricsPromise: Promise<{
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    totalPapers: number;
  }>;
}) {
  const metrics = useStreamedDataWithFallback(() => metricsPromise, {
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalPapers: 0,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700">Total de Usuários</h3>
        <p className="text-3xl font-bold text-blue-600">{metrics.totalUsers}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700">Total de Pedidos</h3>
        <p className="text-3xl font-bold text-green-600">{metrics.totalOrders}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700">Receita Total</h3>
        <p className="text-3xl font-bold text-purple-600">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(metrics.totalRevenue)}
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700">Total de Trabalhos</h3>
        <p className="text-3xl font-bold text-orange-600">{metrics.totalPapers}</p>
      </div>
    </div>
  );
}

// Wrapper com Suspense para streaming components
export function SuspenseWrapper({
  children,
  fallback = <LoadingSpinner />,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

// Componente para streaming de biblioteca do usuário
export function StreamedUserLibrary({
  libraryPromise,
}: { libraryPromise: Promise<LibraryItem[]> }) {
  const library = useStreamedData(() => libraryPromise);

  if (library.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Sua biblioteca está vazia</p>
        <p className="text-sm text-gray-400">Compre alguns materiais para vê-los aqui</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {library.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-semibold">{item.title}</h4>
            <p className="text-sm text-gray-600">{item.type}</p>
          </div>
          <div className="text-sm text-gray-500">
            Adquirido em: {new Date(item.purchaseDate).toLocaleDateString('pt-BR')}
          </div>
        </div>
      ))}
    </div>
  );
}

// Componente para streaming de certificados
export function StreamedCertificates({
  certificatesPromise,
}: {
  certificatesPromise: Promise<Certificate[]>;
}) {
  const certificates = useStreamedData(() => certificatesPromise);

  if (certificates.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Você não possui certificados ainda</p>
        <p className="text-sm text-gray-400">Complete alguns cursos para obter certificados</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {certificates.map((certificate) => (
        <div
          key={certificate.id}
          className="border rounded-lg p-6 bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <h4 className="font-semibold text-lg mb-2">{certificate.courseName}</h4>
          <p className="text-sm text-gray-600 mb-4">
            Certificado Nº: {certificate.certificateNumber}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-sm">
              Nota: <span className="font-semibold text-green-600">{certificate.grade}</span>
            </span>
            <span className="text-sm text-gray-500">
              {new Date(certificate.completedAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
