import { CmsData, LearningPath, Course, Level, Document, ParentId, NormalizedCourse, NormalizedLevel } from '../types';
import { 
    db, 
    auth, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    writeBatch,
    setDoc,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    query,
    where,
    updateDoc,
    deleteDoc
} from '../firebase/config';
import type { FirebaseUser } from '../firebase/config';

/**
 * Lấy tất cả dữ liệu CMS từ Firestore và cấu trúc nó thành một đối tượng được chuẩn hóa.
 * Nếu không tìm thấy dữ liệu, nó sẽ trả về một cấu trúc trống.
 * @returns - Một Promise giải quyết thành đối tượng CmsData.
 */
export const fetchCmsData = async (): Promise<CmsData> => {
    console.log("API: Fetching all CMS data...");
    const collectionsToFetch = [
        getDocs(collection(db, 'learningPaths')),
        getDocs(collection(db, 'courses')),
        getDocs(collection(db, 'levels')),
        getDocs(collection(db, 'documents')),
    ];

    const [pathSnap, courseSnap, levelSnap, docSnap] = await Promise.all(collectionsToFetch);

    const cmsData: CmsData = {
        entities: {
            learningPaths: {},
            courses: {},
            levels: {},
            documents: {},
        },
        root: [],
    };

    pathSnap.forEach(s => {
        const data = s.data();
        cmsData.entities.learningPaths[s.id] = {
            ...(data as Omit<LearningPath, 'courses' | 'documents'>),
            id: s.id,
            courseIds: [], // Sẽ được điền sau
            documentIds: data.documentIds || [] // Sử dụng mảng từ Firestore
        };
    });

    courseSnap.forEach(s => {
        const data = s.data();
        cmsData.entities.courses[s.id] = {
            ...(data as Omit<Course, 'levels' | 'documents'>),
            id: s.id,
            pathId: data.pathId,
            levelIds: [], // Sẽ được điền sau
            documentIds: data.documentIds || [] // Sử dụng mảng từ Firestore
        };
    });

    levelSnap.forEach(s => {
        const data = s.data();
        cmsData.entities.levels[s.id] = {
            ...(data as Omit<Level, 'documents'>),
            id: s.id,
            courseId: data.courseId,
            documentIds: data.documentIds || [] // Sử dụng mảng từ Firestore
        };
    });
    
    docSnap.forEach(s => cmsData.entities.documents[s.id] = { ...s.data(), id: s.id } as Document);

    Object.values(cmsData.entities.levels).forEach(level => {
        if (level.courseId && cmsData.entities.courses[level.courseId]) {
            cmsData.entities.courses[level.courseId].levelIds.push(level.id);
        }
    });

    Object.values(cmsData.entities.courses).forEach(course => {
        if (course.pathId && cmsData.entities.learningPaths[course.pathId]) {
            cmsData.entities.learningPaths[course.pathId].courseIds.push(course.id);
        }
    });

    cmsData.root = Object.keys(cmsData.entities.learningPaths);
    
    console.log("API: Data fetched and normalized successfully.");
    return cmsData;
};

// --- AUTH FUNCTIONS ---
export const login = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const logout = () => signOut(auth);
export const onAuthUserChanged = (callback: (user: FirebaseUser | null) => void) => onAuthStateChanged(auth, callback);


// --- CRUD FUNCTIONS ---

export const addLearningPathToDb = async (pathId: string, pathData: Omit<LearningPath, 'id' | 'courses' | 'documents'>) => {
    await setDoc(doc(db, 'learningPaths', pathId), { ...pathData, id: pathId, documentIds: [] });
};

export const updateLearningPathInDb = async (pathId: string, updates: Partial<LearningPath>) => {
    await updateDoc(doc(db, 'learningPaths', pathId), updates);
};

export const deleteLearningPathFromDb = async (pathId: string) => {
    const batch = writeBatch(db);
    
    // Xóa các document của path
    const pathDocsQuery = query(collection(db, 'documents'), where('pathId', '==', pathId), where('courseId', '==', null));
    const pathDocsSnap = await getDocs(pathDocsQuery);
    pathDocsSnap.forEach(d => batch.delete(d.ref));
    
    // Xóa các course và sub-items của chúng
    const coursesQuery = query(collection(db, 'courses'), where('pathId', '==', pathId));
    const coursesSnap = await getDocs(coursesQuery);
    for (const courseDoc of coursesSnap.docs) {
        await deleteCourseFromDb(courseDoc.id, batch); // Sử dụng batch trong hàm xóa course
    }
    
    // Xóa learning path
    batch.delete(doc(db, 'learningPaths', pathId));
    await batch.commit();
};

export const addCourseAndDocumentsToDb = async (
    courseId: string, 
    pathId: string, 
    courseData: Omit<Course, 'id' | 'levels'>,
    documents: Document[]
): Promise<void> => {
    const batch = writeBatch(db);
    
    const { documents: _docs, ...restOfCourseData } = courseData;

    const courseRef = doc(db, 'courses', courseId);
    batch.set(courseRef, { 
        ...restOfCourseData, 
        pathId, 
        id: courseId, 
        levelIds: [],
        documentIds: documents.map(d => d.id) 
    });

    documents.forEach(document => {
        const docRef = doc(db, 'documents', document.id);
        batch.set(docRef, { ...document, courseId, pathId });
    });

    await batch.commit();
};

export const updateCourseInDb = async (courseId: string, updates: Partial<Course>): Promise<void> => {
    const courseRef = doc(db, 'courses', courseId);
    await updateDoc(courseRef, updates);
};

export const deleteCourseFromDb = async (courseId: string, existingBatch?: ReturnType<typeof writeBatch>): Promise<void> => {
    const batch = existingBatch || writeBatch(db);

    const docsQuery = query(collection(db, 'documents'), where('courseId', '==', courseId));
    const docsSnap = await getDocs(docsQuery);
    docsSnap.forEach(d => batch.delete(d.ref));
    
    const levelsQuery = query(collection(db, 'levels'), where('courseId', '==', courseId));
    const levelsSnap = await getDocs(levelsQuery);
    for (const levelDoc of levelsSnap.docs) {
       await deleteLevelFromDb(levelDoc.id, batch);
    }

    batch.delete(doc(db, 'courses', courseId));
    
    if (!existingBatch) {
        await batch.commit();
    }
};


export const addLevelAndDocumentsToDb = async (
    levelId: string,
    courseId: string,
    levelData: Omit<Level, 'id'>,
    documents: Document[]
): Promise<void> => {
    const batch = writeBatch(db);
    const { documents: _docs, ...restOfLevelData } = levelData;
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    const course = courseSnap.data();

    if (!course) throw new Error("Course not found!");
    
    const levelRef = doc(db, 'levels', levelId);
    batch.set(levelRef, { 
        ...restOfLevelData, 
        courseId, 
        id: levelId, 
        documentIds: documents.map(d => d.id) 
    });

    documents.forEach(document => {
        const docRef = doc(db, 'documents', document.id);
        batch.set(docRef, { ...document, levelId, courseId, pathId: course.pathId });
    });

    batch.update(courseRef, {
        levelIds: [...(course.levelIds || []), levelId]
    });

    await batch.commit();
};

export const updateLevelInDb = async (levelId: string, updates: Partial<Level>): Promise<void> => {
    const levelRef = doc(db, 'levels', levelId);
    await updateDoc(levelRef, updates);
};

export const deleteLevelFromDb = async (levelId: string, existingBatch?: ReturnType<typeof writeBatch>): Promise<void> => {
    const batch = existingBatch || writeBatch(db);
    
    const levelRef = doc(db, 'levels', levelId);
    const levelSnap = await getDoc(levelRef);
    const levelData = levelSnap.data();

    if (levelData) {
        // Xóa documents của level
        const docsQuery = query(collection(db, 'documents'), where('levelId', '==', levelId));
        const docsSnap = await getDocs(docsQuery);
        docsSnap.forEach(d => batch.delete(d.ref));

        // Xóa level
        batch.delete(levelRef);
        
        // Cập nhật course
        const courseRef = doc(db, 'courses', levelData.courseId);
        const courseSnap = await getDoc(courseRef);
        const courseData = courseSnap.data();
        if (courseData) {
            batch.update(courseRef, {
                levelIds: courseData.levelIds.filter((id: string) => id !== levelId)
            });
        }
    }
    
    if (!existingBatch) {
        await batch.commit();
    }
};

export const addDocumentToDb = async (docId: string, parentId: ParentId, docData: Omit<Document, 'id'>): Promise<void> => {
    const docRef = doc(db, 'documents', docId);
    await setDoc(docRef, { ...docData, ...parentId, id: docId });
};

export const updateDocumentInDb = async (docId: string, updates: Partial<Document>): Promise<void> => {
    const docRef = doc(db, 'documents', docId);
    await updateDoc(docRef, updates);
};

export const deleteDocumentFromDb = async (docId: string): Promise<void> => {
    await deleteDoc(doc(db, 'documents', docId));
};

export const reorderDocumentsInDb = async (parentId: ParentId, orderedIds: string[]): Promise<void> => {
    const { pathId, courseId, levelId } = parentId;
    let parentRef;

    if (levelId && courseId) {
        parentRef = doc(db, 'levels', levelId);
    } else if (courseId) {
        parentRef = doc(db, 'courses', courseId);
    } else if (pathId){
        parentRef = doc(db, 'learningPaths', pathId);
    }

    if (parentRef) {
        await updateDoc(parentRef, { documentIds: orderedIds });
    } else {
        console.error("Could not find a valid parent to update document order.", parentId);
        throw new Error("Invalid parent ID for reordering documents.");
    }
};

export const getCoursesByLearningPath = async (learningPathId: string): Promise<Course[]> => {
    console.log(`API: Fetching courses for learning path: ${learningPathId}`);
    try {
        const q = query(collection(db, "courses"), where("pathId", "==", learningPathId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log("No matching courses found.");
            return [];
        }
        
        const courses: Course[] = [];
        querySnapshot.forEach((doc) => {
            courses.push(doc.data() as Course);
        });

        courses.sort((a, b) => a.year - b.year);
        return courses;
    } catch (error) {
        console.error("Error getting courses by learning path: ", error);
        throw error;
    }
};