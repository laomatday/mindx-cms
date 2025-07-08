
import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { AppContextType, User, LearningPath, Course, Level, Document, ParentId, CmsData, NormalizedLevel, NormalizedCourse, NormalizedLearningPath, LevelName } from '../types';
import * as api from '../api/client';

// Tạo Context cho ứng dụng.
export const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

// --- Các hàm tiện ích ---
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
const deepCopy = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

/**
 * Hàm này nhận vào cấu trúc CmsData đã được chuẩn hóa và tái tạo lại cấu trúc lồng nhau
 * mà các component giao diện người dùng (UI) mong đợi.
 */
const denormalizeData = (data: CmsData): LearningPath[] => {
    if (!data || !data.root) return [];
    try {
        return data.root.map(pathId => {
            const path = data.entities.learningPaths[pathId];
            if (!path) return null;
            // Sắp xếp các khóa học theo thuộc tính 'year'
            const sortedCourses = path.courseIds
                .map(id => data.entities.courses[id])
                .filter(Boolean)
                .sort((a, b) => a.year - b.year);

            return {
                id: path.id,
                name: path.name,
                documents: path.documentIds.map(id => data.entities.documents[id]).filter(Boolean),
                courses: sortedCourses.map(course => {
                    if (!course) return null;
                    // By destructuring `pathId` here, it's excluded from `...restOfCourse`
                    const { documentIds: courseDocIds, levelIds, pathId, ...restOfCourse } = course;
                    return {
                        ...restOfCourse,
                        documents: courseDocIds.map(id => data.entities.documents[id]).filter(Boolean),
                        levels: levelIds.map(levelId => {
                            const level = data.entities.levels[levelId];
                            if (!level) return null;
                             // By destructuring `courseId` here, it's excluded from `...restOfLevel`
                            const { documentIds: levelDocIds, courseId, ...restOfLevel } = level;
                            return {
                                ...restOfLevel,
                                documents: levelDocIds.map(id => data.entities.documents[id]).filter(Boolean),
                            };
                        }).filter((l): l is Level => l !== null),
                    };
                }).filter((c): c is Course => c !== null),
            };
        }).filter((p): p is LearningPath => p !== null);
    } catch(e) {
        console.error("Failed to denormalize data:", e, data);
        return [];
    }
};

const EMPTY_CMS_DATA: CmsData = {
    entities: { learningPaths: {}, courses: {}, levels: {}, documents: {} },
    root: [],
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cmsData, setCmsData] = useState<CmsData>(EMPTY_CMS_DATA);
  
  // State for navigation history
  const [history, setHistory] = useState<{ pathId: string | null, courseId: string | null }[]>([{ pathId: localStorage.getItem('selectedPathId'), courseId: localStorage.getItem('selectedCourseId') }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const { pathId: selectedPathId, courseId: selectedCourseId } = history[historyIndex] || { pathId: null, courseId: null };

  const denormalizedData = useMemo(() => denormalizeData(cmsData), [cmsData]);
  
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    const unsubscribe = api.onAuthUserChanged(user => {
        if (user && user.email) {
            const ADMIN_EMAILS = ['admin@test.com', 'academic@mindx.vn'];
            const role = ADMIN_EMAILS.includes(user.email) ? 'admin' : 'user';
            setCurrentUser({ username: user.email, role });
        } else {
            setCurrentUser(null);
        }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    api.fetchCmsData()
      .then(data => {
        setCmsData(data);
      })
      .catch(error => {
        console.error("Failed to fetch initial data", error);
        showToast("Lỗi: Không thể tải dữ liệu từ Firebase.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [showToast]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const navigate = useCallback((pathId: string | null, courseId: string | null) => {
    const currentState = history[historyIndex];
    // Prevent navigating to the exact same state
    if (currentState && currentState.pathId === pathId && currentState.courseId === courseId) {
        return;
    }
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ pathId, courseId });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  useEffect(() => {
    if (loading) return;

    if (!selectedPathId || !cmsData.entities.learningPaths[selectedPathId]) {
      if (selectedPathId !== null || selectedCourseId !== null) {
          navigate(null, null);
      }
      return;
    }
    const path = cmsData.entities.learningPaths[selectedPathId];
    const courseExists = selectedCourseId && cmsData.entities.courses[selectedCourseId];
    const courseInPath = courseExists && path.courseIds.includes(selectedCourseId);

    if (selectedCourseId && !courseInPath) {
        navigate(selectedPathId, null);
    }
  }, [loading, cmsData, selectedPathId, selectedCourseId, navigate]);

  useEffect(() => {
    if (selectedPathId) localStorage.setItem('selectedPathId', selectedPathId);
    else localStorage.removeItem('selectedPathId');
    if (selectedCourseId) localStorage.setItem('selectedCourseId', selectedCourseId);
    else localStorage.removeItem('selectedCourseId');
  }, [selectedPathId, selectedCourseId]);

  const goBack = useCallback(() => {
    setHistoryIndex(prev => Math.max(0, prev - 1));
  }, []);

  const goForward = useCallback(() => {
    setHistoryIndex(prev => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const login = useCallback(async (email: string, pass: string): Promise<boolean> => {
    try {
      await api.login(email, pass);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
        await api.logout();
    } catch (error) {
        console.error("Error signing out: ", error);
        showToast("Đăng xuất thất bại.");
    }
  }, [showToast]);

  const optimisticUpdate = useCallback(async (
    updateFunction: (state: CmsData) => CmsData,
    apiCall: () => Promise<any>,
    successMessage: string,
    errorMessage: string
  ) => {
    const originalState = cmsData;
    const newState = updateFunction(deepCopy(originalState));
    setCmsData(newState);

    try {
      await apiCall();
      showToast(successMessage);
    } catch (error) {
      console.error(errorMessage, error);
      showToast(`Lỗi: ${errorMessage}`);
      setCmsData(originalState);
    }
  }, [cmsData, showToast]);

  const addCourse = useCallback(async (pathId: string, courseData: Omit<Course, 'id' | 'levels' | 'documents'>) => {
    const newCourseId = generateId('c');
    
    const defaultLevelsData = [
      { name: LevelName.BASIC, content: 'Nội dung cấp độ cơ bản.', objectives: 'Mục tiêu cấp độ cơ bản.' },
      { name: LevelName.ADVANCED, content: 'Nội dung cấp độ nâng cao.', objectives: 'Mục tiêu cấp độ nâng cao.' },
      { name: LevelName.INTENSIVE, content: 'Nội dung cấp độ chuyên sâu.', objectives: 'Mục tiêu cấp độ chuyên sâu.' }
    ];

    const newLevels = defaultLevelsData.map(data => ({
      id: generateId('l'),
      data: data
    }));

    const newLevelIds = newLevels.map(l => l.id);

    await optimisticUpdate(
      state => {
        const newCourse: NormalizedCourse = { 
          ...courseData, 
          id: newCourseId, 
          pathId: pathId, 
          levelIds: newLevelIds, 
          documentIds: [] 
        };
        state.entities.courses[newCourse.id] = newCourse;
        state.entities.learningPaths[pathId]?.courseIds.push(newCourse.id);

        newLevels.forEach(level => {
          const newLevel: NormalizedLevel = {
            ...level.data,
            id: level.id,
            courseId: newCourseId,
            documentIds: []
          };
          state.entities.levels[level.id] = newLevel;
        });

        return state;
      },
      () => api.addCourseWithLevelsToDb(newCourseId, pathId, courseData, newLevels),
      'Thêm khóa học và các cấp độ mặc định thành công!',
      'Không thể thêm khóa học'
    );
  }, [optimisticUpdate]);

  const updateCourse = useCallback(async (pathId: string, courseId: string, updates: Partial<Course>) => {
    await optimisticUpdate(
      state => {
        const course = state.entities.courses[courseId];
        if (course) state.entities.courses[courseId] = { ...course, ...updates };
        return state;
      },
      () => api.updateCourseInDb(courseId, updates),
      'Cập nhật khóa học thành công!',
      'Không thể cập nhật khóa học'
    );
  }, [optimisticUpdate]);

  const deleteCourse = useCallback(async (pathId: string, courseId: string) => {
    await optimisticUpdate(
      state => {
        const courseToDelete = state.entities.courses[courseId];
        if (!courseToDelete) return state;

        courseToDelete.levelIds.forEach(levelId => {
          state.entities.levels[levelId]?.documentIds.forEach(docId => delete state.entities.documents[docId]);
          delete state.entities.levels[levelId];
        });
        courseToDelete.documentIds.forEach(docId => delete state.entities.documents[docId]);

        const path = state.entities.learningPaths[pathId];
        if (path) path.courseIds = path.courseIds.filter(id => id !== courseId);
        
        delete state.entities.courses[courseId];
        return state;
      },
      () => api.deleteCourseFromDb(courseId),
      'Xóa khóa học thành công!',
      'Không thể xóa khóa học'
    );
  }, [optimisticUpdate]);
  
  const addLevel = useCallback(async (pathId: string, courseId: string, levelData: Omit<Level, 'id' | 'documents'>) => {
    const newLevelId = generateId('l');
    await optimisticUpdate(
      state => {
        const newLevel: NormalizedLevel = { ...levelData, id: newLevelId, courseId: courseId, documentIds: [] };
        state.entities.levels[newLevel.id] = newLevel;
        state.entities.courses[courseId]?.levelIds.push(newLevel.id);
        return state;
      },
      () => api.addLevelToDb(newLevelId, courseId, levelData),
      'Thêm cấp độ thành công!',
      'Không thể thêm cấp độ'
    );
  }, [optimisticUpdate]);

  const updateLevel = useCallback(async (pathId: string, courseId: string, levelId: string, updates: Partial<Level>) => {
    await optimisticUpdate(
      state => {
        const level = state.entities.levels[levelId];
        if (level) state.entities.levels[levelId] = { ...level, ...updates };
        return state;
      },
      () => api.updateLevelInDb(levelId, updates),
      'Cập nhật cấp độ thành công!',
      'Không thể cập nhật cấp độ'
    );
  }, [optimisticUpdate]);

  const deleteLevel = useCallback(async (pathId: string, courseId: string, levelId: string) => {
    await optimisticUpdate(
      state => {
        const levelToDelete = state.entities.levels[levelId];
        if (!levelToDelete) return state;
        levelToDelete.documentIds.forEach(docId => delete state.entities.documents[docId]);
        const course = state.entities.courses[courseId];
        if (course) course.levelIds = course.levelIds.filter(id => id !== levelId);
        delete state.entities.levels[levelId];
        return state;
      },
      () => api.deleteLevelFromDb(levelId),
      'Xóa cấp độ thành công!',
      'Không thể xóa cấp độ'
    );
  }, [optimisticUpdate]);

  const addDocument = useCallback(async (parentId: ParentId, documentData: Omit<Document, 'id'>) => {
    const newDocId = generateId('doc');
    const { pathId, courseId, levelId } = parentId;
    const currentState = cmsData;
    let parent: NormalizedLearningPath | NormalizedCourse | NormalizedLevel | undefined;
    
    if (levelId && courseId) parent = currentState.entities.levels[levelId];
    else if (courseId) parent = currentState.entities.courses[courseId];
    else parent = currentState.entities.learningPaths[pathId];

    const newDocIds = [...(parent?.documentIds || []), newDocId];
    
    await optimisticUpdate(
      state => {
        const newDocument: Document = { ...documentData, id: newDocId };
        state.entities.documents[newDocument.id] = newDocument;
        if (levelId && courseId) {
          state.entities.levels[levelId]?.documentIds.push(newDocument.id);
        } else if (courseId) {
          state.entities.courses[courseId]?.documentIds.push(newDocument.id);
        } else {
          state.entities.learningPaths[pathId]?.documentIds.push(newDocument.id);
        }
        return state;
      },
      async () => {
        // Cả hai thao tác phải được thực hiện: thêm document và cập nhật mảng IDs của parent
        await api.addDocumentToDb(newDocId, parentId, documentData);
        await api.reorderDocumentsInDb(parentId, newDocIds);
      },
      'Thêm tài liệu thành công!',
      'Không thể thêm tài liệu'
    );
  }, [optimisticUpdate, cmsData]);
  
  const updateDocument = useCallback(async (parentId: ParentId, documentId: string, updates: Partial<Document>) => {
    await optimisticUpdate(
      state => {
        const doc = state.entities.documents[documentId];
        if(doc) state.entities.documents[documentId] = { ...doc, ...updates };
        return state;
      },
      () => api.updateDocumentInDb(documentId, updates),
      'Cập nhật tài liệu thành công!',
      'Không thể cập nhật tài liệu'
    );
  }, [optimisticUpdate]);

  const deleteDocument = useCallback(async (parentId: ParentId, documentId: string) => {
    const currentState = cmsData;
    const { pathId, courseId, levelId } = parentId;
    let parent: NormalizedLearningPath | NormalizedCourse | NormalizedLevel | undefined;
    
    if (levelId && courseId) parent = currentState.entities.levels[levelId];
    else if (courseId) parent = currentState.entities.courses[courseId];
    else parent = currentState.entities.learningPaths[pathId];

    const newDocIds = parent?.documentIds.filter(id => id !== documentId) || [];

     await optimisticUpdate(
      state => {
        if (levelId && courseId) {
          const level = state.entities.levels[levelId];
          if (level) level.documentIds = level.documentIds.filter(id => id !== documentId);
        } else if (courseId) {
          const course = state.entities.courses[courseId];
          if (course) course.documentIds = course.documentIds.filter(id => id !== documentId);
        } else {
          const path = state.entities.learningPaths[pathId];
          if (path) path.documentIds = path.documentIds.filter(id => id !== documentId);
        }
        delete state.entities.documents[documentId];
        return state;
      },
      async () => {
        await api.deleteDocumentFromDb(documentId);
        await api.reorderDocumentsInDb(parentId, newDocIds);
      },
      'Xóa tài liệu thành công!',
      'Không thể xóa tài liệu'
    );
  }, [optimisticUpdate, cmsData]);

  const reorderDocuments = useCallback(async (parentId: ParentId, orderedIds: string[]) => {
    await optimisticUpdate(
        state => {
            const { pathId, courseId, levelId } = parentId;
            let parent: NormalizedLearningPath | NormalizedCourse | NormalizedLevel | undefined;

            if (levelId && courseId) {
                parent = state.entities.levels[levelId];
            } else if (courseId) {
                parent = state.entities.courses[courseId];
            } else {
                parent = state.entities.learningPaths[pathId];
            }
            if (parent) {
                parent.documentIds = orderedIds;
            }
            return state;
        },
        () => api.reorderDocumentsInDb(parentId, orderedIds),
        'Sắp xếp tài liệu thành công!',
        'Không thể sắp xếp tài liệu'
    );
  }, [optimisticUpdate]);

  const contextValue: AppContextType = {
    currentUser,
    login,
    logout,
    data: denormalizedData,
    selectedPathId,
    selectedCourseId,
    navigate,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    addCourse,
    updateCourse,
    deleteCourse,
    addLevel,
    updateLevel,
    deleteLevel,
    addDocument,
    updateDocument,
    deleteDocument,
    reorderDocuments,
    toast,
    showToast,
    loading,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};
