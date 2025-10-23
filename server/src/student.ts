import QRCode from 'qrcode';
import { prisma } from './prisma';

export async function getStudentDashboard(userId: string) {
  const [
    user,
    ordersCount,
    coursesCount,
    certificatesCount,
    libraryCount,
    recentOrders,
    recentCertificates,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        verified: true,
      },
    }),
    prisma.order.count({
      where: { userId, status: 'COMPLETED' },
    }),
    prisma.certificate.count({
      where: { userId },
    }),
    prisma.certificate.count({
      where: { userId },
    }),
    prisma.library.count({
      where: { userId },
    }),
    prisma.order.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          select: {
            title: true,
            price: true,
          },
        },
      },
    }),
    prisma.certificate.findMany({
      where: { userId },
      take: 3,
      orderBy: { completionDate: 'desc' },
      include: {
        course: {
          select: {
            title: true,
            thumbnailUrl: true,
          },
        },
      },
    }),
  ]);

  return {
    user,
    stats: {
      totalOrders: ordersCount,
      enrolledCourses: coursesCount,
      certificates: certificatesCount,
      libraryItems: libraryCount,
    },
    recentOrders,
    recentCertificates,
  };
}

export async function getStudentCourses(userId: string) {
  // Buscar enrollments do usuário
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: true,
            },
          },
        },
      },
    },
  });

  // Buscar progresso de lições do usuário
  const courseProgress = await prisma.courseProgress.findMany({
    where: { userId },
    select: {
      lessonId: true,
      completed: true,
    },
  });

  const completedLessonsSet = new Set(
    courseProgress.filter(p => p.completed).map(p => p.lessonId)
  );

  // Buscar certificados para identificar cursos concluídos
  const certificates = await prisma.certificate.findMany({
    where: { userId },
    select: { courseId: true },
  });
  const completedCourseIds = new Set(certificates.map(cert => cert.courseId));

  // Formatar cursos no formato esperado pelo frontend
  const courses = enrollments.map(enrollment => {
    const course = enrollment.course;

    // Calcular total de lições
    const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);

    // Calcular lições completadas deste curso
    const courseLessonIds = course.modules.flatMap(module => module.lessons.map(lesson => lesson.id));
    const completedLessons = courseLessonIds.filter(lessonId => completedLessonsSet.has(lessonId)).length;

    // Calcular progresso em porcentagem
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Determinar status
    let status: 'IN_PROGRESS' | 'COMPLETED' | 'NOT_STARTED';
    if (completedCourseIds.has(course.id)) {
      status = 'COMPLETED';
    } else if (progress > 0) {
      status = 'IN_PROGRESS';
    } else {
      status = 'NOT_STARTED';
    }

    // Converter duração de minutos para string formatada
    const hours = Math.floor(course.duration / 60);
    const minutes = course.duration % 60;
    const durationStr = hours > 0
      ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`
      : `${minutes}min`;

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      instructor: course.instructorName,
      category: course.academicArea,
      progress,
      totalLessons,
      completedLessons,
      duration: durationStr,
      rating: 4.5, // Valor fixo por enquanto
      status,
      thumbnailUrl: course.thumbnailUrl,
    };
  });

  return courses;
}

export async function getStudentLibrary(userId: string) {
  const library = await prisma.library.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const itemsWithDetails = await Promise.all(
    library.map(async (item) => {
      let details: Record<string, unknown> | null = null;

      if (item.itemType === 'PAPER') {
        details = await prisma.paper.findUnique({
          where: { id: item.itemId },
          select: {
            title: true,
            description: true,
            paperType: true,
            pageCount: true,
            authorName: true,
            thumbnailUrl: true,
          },
        });
      } else if (item.itemType === 'EBOOK') {
        details = await prisma.ebook.findUnique({
          where: { id: item.itemId },
          select: {
            title: true,
            description: true,
            pageCount: true,
            authorName: true,
            coverUrl: true,
          },
        });
      } else if (item.itemType === 'COURSE_MATERIAL') {
        details = await prisma.course.findUnique({
          where: { id: item.itemId },
          select: {
            title: true,
            description: true,
            instructorName: true,
            duration: true,
            thumbnailUrl: true,
          },
        });
      }

      return {
        id: item.id,
        type: item.itemType,
        downloadUrl: item.downloadUrl,
        expiresAt: item.expiresAt,
        createdAt: item.createdAt,
        details,
      };
    })
  );

  return itemsWithDetails;
}

export async function getStudentDownloads(userId: string) {
  const library = await prisma.library.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const downloads = await Promise.all(
    library.map(async (item) => {
      let title = 'Documento';
      let type: 'PDF' | 'DOC' | 'EBOOK' | 'MATERIAL' = 'MATERIAL';
      let size = 'N/A';

      if (item.itemType === 'PAPER') {
        const paper = await prisma.paper.findUnique({
          where: { id: item.itemId },
          select: {
            title: true,
            pageCount: true,
          },
        });
        if (paper) {
          title = paper.title;
          type = 'PDF';
          size = paper.pageCount ? `${paper.pageCount} páginas` : 'N/A';
        }
      } else if (item.itemType === 'EBOOK') {
        const ebook = await prisma.ebook.findUnique({
          where: { id: item.itemId },
          select: {
            title: true,
            pageCount: true,
          },
        });
        if (ebook) {
          title = ebook.title;
          type = 'EBOOK';
          size = ebook.pageCount ? `${ebook.pageCount} páginas` : 'N/A';
        }
      } else if (item.itemType === 'COURSE_MATERIAL') {
        const course = await prisma.course.findUnique({
          where: { id: item.itemId },
          select: {
            title: true,
          },
        });
        if (course) {
          title = course.title;
          type = 'MATERIAL';
          size = 'Material do Curso';
        }
      }

      return {
        id: item.id,
        title,
        type,
        size,
        downloadUrl: item.downloadUrl,
        downloadedAt: item.createdAt.toISOString(),
        expiresAt: item.expiresAt?.toISOString(),
      };
    })
  );

  return downloads;
}

export async function getStudentCertificates(userId: string) {
  const certificates = await prisma.certificate.findMany({
    where: { userId },
    orderBy: { completionDate: 'desc' },
    include: {
      course: {
        select: {
          title: true,
          description: true,
          instructorName: true,
          duration: true,
          thumbnailUrl: true,
        },
      },
    },
  });

  return certificates;
}

export async function generateCertificateQRCode(certificateId: string): Promise<string> {
  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      course: {
        select: {
          title: true,
          instructorName: true,
        },
      },
    },
  });

  if (!certificate) {
    throw new Error('Certificate not found');
  }

  const verificationUrl = `https://lneducacional.com.br/verify/certificate/${certificate.certificateNumber}`;
  const qrData = {
    url: verificationUrl,
    certificateNumber: certificate.certificateNumber,
    studentName: certificate.user.name,
    courseTitle: certificate.course.title,
    completionDate: certificate.completionDate.toISOString(),
    grade: certificate.grade,
  };

  const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  await prisma.certificate.update({
    where: { id: certificateId },
    data: { qrCodeUrl: qrCodeDataUrl },
  });

  return qrCodeDataUrl;
}

export async function completeCourse(userId: string, courseId: string, grade: number) {
  const existingCertificate = await prisma.certificate.findFirst({
    where: { userId, courseId },
  });

  if (existingCertificate) {
    throw new Error('Course already completed');
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('Course not found');
  }

  const userHasCourse = await prisma.order.findFirst({
    where: {
      userId,
      status: 'COMPLETED',
      items: {
        some: { courseId },
      },
    },
  });

  if (!userHasCourse) {
    throw new Error('User not enrolled in this course');
  }

  const certificateNumber = `CERT-${Date.now()}-${userId.slice(-4).toUpperCase()}`;

  const certificate = await prisma.certificate.create({
    data: {
      userId,
      courseId,
      certificateNumber,
      grade,
      completionDate: new Date(),
      qrCodeUrl: '',
    },
    include: {
      course: true,
      user: true,
    },
  });

  await generateCertificateQRCode(certificate.id);

  return certificate;
}

export async function getStudentProfile(userId: string) {
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      birthDate: true,
      profession: true,
      profileImageUrl: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
      role: true,
      verified: true,
      createdAt: true,
      _count: {
        select: {
          orders: true,
          certificates: true,
          library: true,
        },
      },
    },
  });

  if (!profile) {
    throw new Error('User not found');
  }

  return {
    ...profile,
    stats: {
      totalOrders: profile._count.orders,
      totalCertificates: profile._count.certificates,
      totalLibraryItems: profile._count.library,
    },
  };
}

export async function updateStudentProfile(
  userId: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    profession?: string;
    profileImageUrl?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    currentPassword?: string;
    newPassword?: string;
  }
) {
  const updateData: Record<string, unknown> = {};

  if (data.name) {
    updateData.name = data.name;
  }

  if (data.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new Error('Email already in use');
    }

    updateData.email = data.email;
    updateData.verified = false;
  }

  // Handle profile fields
  if (data.phone !== undefined) {
    updateData.phone = data.phone;
  }

  if (data.birthDate !== undefined) {
    updateData.birthDate = data.birthDate;
  }

  if (data.profession !== undefined) {
    updateData.profession = data.profession;
  }

  if (data.profileImageUrl !== undefined) {
    updateData.profileImageUrl = data.profileImageUrl;
  }

  if (data.address !== undefined) {
    updateData.address = data.address;
  }

  if (data.city !== undefined) {
    updateData.city = data.city;
  }

  if (data.state !== undefined) {
    updateData.state = data.state;
  }

  if (data.zipCode !== undefined) {
    updateData.zipCode = data.zipCode;
  }

  if (data.country !== undefined) {
    updateData.country = data.country;
  }

  if (data.currentPassword && data.newPassword) {
    const { verifyPassword, hashPassword } = await import('./auth');

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await verifyPassword(user.password, data.currentPassword);

    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    updateData.password = await hashPassword(data.newPassword);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      birthDate: true,
      profession: true,
      profileImageUrl: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
      role: true,
      verified: true,
    },
  });

  return updatedUser;
}

export async function verifyCertificate(certificateNumber: string) {
  const certificate = await prisma.certificate.findUnique({
    where: { certificateNumber },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      course: {
        select: {
          title: true,
          description: true,
          instructorName: true,
          duration: true,
        },
      },
    },
  });

  if (!certificate) {
    throw new Error('Certificate not found');
  }

  return {
    valid: true,
    certificate: {
      number: certificate.certificateNumber,
      studentName: certificate.user.name,
      courseTitle: certificate.course.title,
      courseDescription: certificate.course.description,
      instructorName: certificate.course.instructorName,
      courseDuration: certificate.course.duration,
      grade: certificate.grade,
      completionDate: certificate.completionDate,
      issuedAt: certificate.createdAt,
    },
  };
}
