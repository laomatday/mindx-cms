import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { AppContextType, User, LearningPath, Course, Level, Document, ParentId, CmsData, NormalizedLevel, NormalizedCourse, NormalizedLearningPath, CreationState, CreationType, EditableItem, LevelName } from '../types';
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
  const [activeDocument, setActiveDocument] = useState<{ url: string; name: string; pathName?: string; courseName?: string; levelName?: LevelName } | null>(null);
  const [creationState, setCreationState] = useState<CreationState | null>(null);
  
  // State for navigation history
  const [history, setHistory] = useState<{ pathId: string | null, courseId: string | null }[]>([{ pathId: localStorage.getItem('selectedPathId'), courseId: localStorage.getItem('selectedCourseId') }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const { pathId: selectedPathId, courseId: selectedCourseId } = history[historyIndex] || { pathId: null, courseId: null };

  const denormalizedData = useMemo(() => denormalizeData(cmsData), [cmsData]);
  
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const viewDocument = useCallback((doc: { url: string; name: string; pathName?: string; courseName?: string; levelName?: LevelName }) => {
    setActiveDocument(doc);
  }, []);

  const closeDocument = useCallback(() => {
    setActiveDocument(null);
  }, []);

  const showCreationWizard = useCallback((type: CreationType, parentId: ParentId, itemToEdit?: EditableItem) => {
    setCreationState({ type, parentId, itemToEdit });
  }, []);
  const hideCreationWizard = useCallback(() => {
    setCreationState(null);
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
    if (currentState && currentState.pathId === pathId && currentState.courseId === courseId) {
        return;
    }
    
    // When navigating the main hierarchy, always close any open document.
    if (activeDocument) {
        setActiveDocument(null);
    }
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ pathId, courseId });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, activeDocument]);

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
    if (activeDocument) {
        // If a document is open, the "back" action should close it first.
        closeDocument();
    } else if (historyIndex > 0) {
        // Otherwise, go back in the navigation history.
        setHistoryIndex(prev => prev - 1);
    }
  }, [activeDocument, historyIndex, closeDocument]);


  const goForward = useCallback(() => {
    setHistoryIndex(prev => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  const canGoBack = activeDocument !== null || historyIndex > 0;
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

  const addLearningPath = useCallback(async (pathData: Omit<LearningPath, 'id' | 'courses' | 'documents'>) => {
    const newPathId = generateId('lp');
    await optimisticUpdate(
      state => {
        const newPath: NormalizedLearningPath = { ...pathData, id: newPathId, courseIds: [], documentIds: [] };
        state.entities.learningPaths[newPathId] = newPath;
        state.root.push(newPathId);
        return state;
      },
      () => api.addLearningPathToDb(newPathId, pathData),
      'Thêm lộ trình học thành công!',
      'Không thể thêm lộ trình học'
    );
  }, [optimisticUpdate]);

  const updateLearningPath = useCallback(async (pathId: string, updates: Partial<LearningPath>) => {
    await optimisticUpdate(
      state => {
        const path = state.entities.learningPaths[pathId];
        if (path) state.entities.learningPaths[pathId] = { ...path, ...updates };
        return state;
      },
      () => api.updateLearningPathInDb(pathId, updates),
      'Cập nhật lộ trình học thành công!',
      'Không thể cập nhật lộ trình học'
    );
  }, [optimisticUpdate]);

  const deleteLearningPath = useCallback(async (pathId: string) => {
    await optimisticUpdate(
      state => {
        const pathToDelete = state.entities.learningPaths[pathId];
        if (!pathToDelete) return state;

        pathToDelete.courseIds.forEach(courseId => {
            const courseToDelete = state.entities.courses[courseId];
            if (!courseToDelete) return;

            courseToDelete.levelIds.forEach(levelId => {
              state.entities.levels[levelId]?.documentIds.forEach(docId => delete state.entities.documents[docId]);
              delete state.entities.levels[levelId];
            });
            courseToDelete.documentIds.forEach(docId => delete state.entities.documents[docId]);
            delete state.entities.courses[courseId];
        });
        
        pathToDelete.documentIds.forEach(docId => delete state.entities.documents[docId]);

        delete state.entities.learningPaths[pathId];
        state.root = state.root.filter(id => id !== pathId);
        
        return state;
      },
      () => api.deleteLearningPathFromDb(pathId),
      'Xóa lộ trình học thành công!',
      'Không thể xóa lộ trình học'
    );
  }, [optimisticUpdate]);

  const addCourse = useCallback(async (pathId: string, courseData: Omit<Course, 'id' | 'levels'>) => {
    const newCourseId = generateId('c');
    const documents = courseData.documents || [];
    const newDocuments = documents.map(doc => ({ ...doc, id: generateId('doc')}));
    const newDocIds = newDocuments.map(d => d.id);

    await optimisticUpdate(
      state => {
        const { documents: _docs, ...restOfCourseData } = courseData;
        const newCourse: NormalizedCourse = { 
          ...restOfCourseData,
          id: newCourseId, 
          pathId: pathId, 
          levelIds: [], // Start with no levels
          documentIds: newDocIds
        };
        state.entities.courses[newCourse.id] = newCourse;
        state.entities.learningPaths[pathId]?.courseIds.push(newCourse.id);

        newDocuments.forEach(doc => {
            state.entities.documents[doc.id] = doc;
        });

        return state;
      },
      () => api.addCourseAndDocumentsToDb(newCourseId, pathId, courseData, newDocuments),
      'Thêm khóa học thành công!',
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
  
  const addLevel = useCallback(async (pathId: string, courseId: string, levelData: Omit<Level, 'id'>) => {
    const newLevelId = generateId('l');
    const documents = levelData.documents || [];
    const newDocuments = documents.map(doc => ({ ...doc, id: generateId('doc')}));
    const newDocIds = newDocuments.map(d => d.id);

    await optimisticUpdate(
      state => {
        const { documents: _docs, ...restOfLevelData } = levelData;
        const newLevel: NormalizedLevel = { 
          ...restOfLevelData,
          id: newLevelId, 
          courseId: courseId, 
          documentIds: newDocIds
        };
        state.entities.levels[newLevel.id] = newLevel;
        state.entities.courses[courseId]?.levelIds.push(newLevel.id);
        
        newDocuments.forEach(doc => {
            state.entities.documents[doc.id] = doc;
        });

        return state;
      },
      () => api.addLevelAndDocumentsToDb(newLevelId, courseId, levelData, newDocuments),
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
    else if (pathId) parent = currentState.entities.learningPaths[pathId];

    const newDocIds = [...(parent?.documentIds || []), newDocId];
    
    await optimisticUpdate(
      state => {
        const newDocument: Document = { ...documentData, id: newDocId };
        state.entities.documents[newDocument.id] = newDocument;
        if (levelId && courseId) {
          state.entities.levels[levelId]!.documentIds.push(newDocument.id);
        } else if (courseId) {
          state.entities.courses[courseId]!.documentIds.push(newDocument.id);
        } else if (pathId) {
          state.entities.learningPaths[pathId]!.documentIds.push(newDocument.id);
        }
        return state;
      },
      async () => {
        // Cả hai thao tác phải được thực hiện: thêm document và cập nhật mảng IDs của parent
        await api.addDocumentToDb(newDocId, parentId, documentData);
        if (parentId.pathId || parentId.courseId || parentId.levelId) {
           await api.reorderDocumentsInDb(parentId, newDocIds);
        }
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
    else if (pathId) parent = currentState.entities.learningPaths[pathId];

    const newDocIds = parent?.documentIds.filter(id => id !== documentId) || [];

     await optimisticUpdate(
      state => {
        if (levelId && courseId) {
          const level = state.entities.levels[levelId];
          if (level) level.documentIds = level.documentIds.filter(id => id !== documentId);
        } else if (courseId) {
          const course = state.entities.courses[courseId];
          if (course) course.documentIds = course.documentIds.filter(id => id !== documentId);
        } else if (pathId) {
          const path = state.entities.learningPaths[pathId];
          if (path) path.documentIds = path.documentIds.filter(id => id !== documentId);
        }
        delete state.entities.documents[documentId];
        return state;
      },
      async () => {
        await api.deleteDocumentFromDb(documentId);
        if (parentId.pathId || parentId.courseId || parentId.levelId) {
          await api.reorderDocumentsInDb(parentId, newDocIds);
        }
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
            } else if (pathId) {
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
    addLearningPath,
    updateLearningPath,
    deleteLearningPath,
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
    activeDocument,
    viewDocument,
    closeDocument,
    creationState,
    showCreationWizard,
    hideCreationWizard,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};