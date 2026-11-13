/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useCallback, useEffect, useRef, useState } from 'react';
import { generateUUID } from '../utils/helpers';

const AppContext = createContext(null);

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const initialState = {
  students: [],
  attendance: {},
  selectedAttendanceDate: toISODate(new Date()),
  monthlyAttendance: {},
  announcements: [],
  assignments: [],
  newsletters: [],
  polls: [],
  toasts: [],
  weeklyPlans: {},
  quickLinks: [],
  isAdmin: false,
  settings: {
    darkMode: false,
    fontSize: 'medium',
  },
  ddays: [],
  studentRecords: {},
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STUDENTS': return { ...state, students: action.payload };
    case 'SET_ANNOUNCEMENTS': return { ...state, announcements: action.payload };
    case 'SET_ASSIGNMENTS': return { ...state, assignments: action.payload };
    case 'SET_ATTENDANCE_MAP': return { ...state, attendance: action.payload };
    case 'SET_SELECTED_ATTENDANCE_DATE': return { ...state, selectedAttendanceDate: action.payload };
    case 'SET_MONTHLY_ATTENDANCE': {
      const newMonthly = { ...state.monthlyAttendance };
      for (const [date, records] of Object.entries(action.payload)) {
        newMonthly[date] = { ...newMonthly[date], ...records };
      }
      return { ...state, monthlyAttendance: newMonthly };
    }
    case 'UPDATE_MONTHLY_ATTENDANCE': {
      const { date, studentId, status, id } = action.payload;
      const dateRecords = state.monthlyAttendance[date] || {};
      return {
        ...state,
        monthlyAttendance: {
          ...state.monthlyAttendance,
          [date]: {
            ...dateRecords,
            [studentId]: {
              status,
              note: dateRecords[studentId]?.note || '',
              id: id || dateRecords[studentId]?.id
            }
          }
        }
      };
    }
    case 'SET_ATTENDANCE':
      return {
        ...state,
        attendance: {
          ...state.attendance,
          [action.payload.studentId]: {
            status: action.payload.status,
            note: action.payload.note || '',
            id: action.payload.id || state.attendance[action.payload.studentId]?.id
          },
        },
      };
    case 'UPDATE_POINTS':
      return {
        ...state,
        students: state.students.map(s => s.id === action.payload.studentId ? { ...s, points: Math.max(0, s.points + action.payload.amount) } : s),
      };
    case 'RESET_POINTS':
      return {
        ...state,
        students: state.students.map(s => s.id === action.payload.studentId ? { ...s, points: 0 } : s),
      };
    case 'ADD_ANNOUNCEMENT': return { ...state, announcements: [action.payload, ...state.announcements] };
    case 'UPDATE_ANNOUNCEMENT': return { ...state, announcements: state.announcements.map(a => a.id === action.payload.id ? action.payload : a) };
    case 'DELETE_ANNOUNCEMENT': return { ...state, announcements: state.announcements.filter(a => a.id !== action.payload) };
    case 'ADD_ASSIGNMENT': return { ...state, assignments: [...state.assignments, action.payload] };
    case 'DELETE_ASSIGNMENT': return { ...state, assignments: state.assignments.filter(a => a.id !== action.payload) };
    case 'UPDATE_ASSIGNMENT_SUBMISSIONS':
      return {
        ...state,
        assignments: state.assignments.map(a => a.id === action.payload.id ? { ...a, submissions: { ...a.submissions, ...action.payload.submissions } } : a),
      };
    case 'EVALUATE_ASSIGNMENT':
      return {
        ...state,
        assignments: state.assignments.map(a => {
          if (a.id === action.payload.id) {
            const currentSub = a.submissions?.[action.payload.studentId] || {};
            return { ...a, submissions: { ...a.submissions, [action.payload.studentId]: { ...currentSub, grade: action.payload.grade } } };
          }
          return a;
        }),
      };
    case 'ADD_DDAY': return { ...state, ddays: [...state.ddays, action.payload] };
    case 'DELETE_DDAY': return { ...state, ddays: state.ddays.filter(d => d.id !== action.payload) };
    case 'SET_DDAYS': return { ...state, ddays: action.payload };
    case 'ADD_POLL': return { ...state, polls: [...state.polls, action.payload] };
    case 'DELETE_POLL': return { ...state, polls: state.polls.filter(p => p.id !== action.payload) };
    case 'SET_POLLS': return { ...state, polls: action.payload };
    case 'VOTE_POLL':
      return {
        ...state,
        polls: state.polls.map(p => p.id === action.payload.pollId ? { ...p, votes: action.payload.newVotes } : p),
      };
    case 'ADD_TOAST': return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'ADD_STUDENT': return { ...state, students: [...state.students, action.payload] };
    case 'UPDATE_STUDENT': return { ...state, students: state.students.map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s) };
    case 'BULK_UPDATE_STUDENTS':
      return {
        ...state,
        students: state.students.map(s => {
          const update = action.payload.find(u => u.id === s.id);
          return update ? { ...s, ...update } : s;
        }),
      };
    case 'SET_NEWSLETTERS': return { ...state, newsletters: action.payload };
    case 'COLLECT_NEWSLETTER':
      return {
        ...state,
        newsletters: state.newsletters.map(n => n.id === action.payload.id ? { ...n, collected: action.payload.collected } : n),
      };
    case 'TOGGLE_ADMIN': return { ...state, isAdmin: action.payload };
    case 'UPDATE_SETTINGS': return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'SET_WEEKLY_PLAN': {
      const { weekKey, day, period, subject, content } = action.payload;
      const existingWeek = state.weeklyPlans[weekKey] || {};
      return {
        ...state,
        weeklyPlans: {
          ...state.weeklyPlans,
          [weekKey]: {
            ...existingWeek,
            [day]: { ...(existingWeek[day] || {}), [period]: { subject, content } }
          }
        }
      };
    }
    case 'SET_WEEKLY_PLANS_BULK': return { ...state, weeklyPlans: action.payload };
    case 'SET_QUICK_LINKS': return { ...state, quickLinks: action.payload };
    case 'ADD_LINK': return { ...state, quickLinks: [...state.quickLinks, action.payload] };
    case 'UPDATE_LINK': return { ...state, quickLinks: state.quickLinks.map(l => l.id === action.payload.id ? action.payload : l) };
    case 'DELETE_LINK': return { ...state, quickLinks: state.quickLinks.filter(l => l.id !== action.payload) };
    case 'SET_STUDENT_RECORDS': return { ...state, studentRecords: action.payload };
    case 'ADD_STUDENT_RECORD': {
      const { studentId, record } = action.payload;
      const existing = state.studentRecords[studentId] || [];
      return { ...state, studentRecords: { ...state.studentRecords, [studentId]: [...existing, record] } };
    }
    case 'DELETE_STUDENT_RECORD': {
      const { studentId, recordId } = action.payload;
      const existing = state.studentRecords[studentId] || [];
      return { ...state, studentRecords: { ...state.studentRecords, [studentId]: existing.filter(r => r.id !== recordId) } };
    }
    default: return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const saveTimer = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 3000);
  }, []);

  // 최초 로드: 로컬 데이터 파일(/api/db)에서 불러오기
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/db');
        const db = await res.json();

        if (db.students) dispatch({ type: 'SET_STUDENTS', payload: db.students });
        if (db.announcements) dispatch({ type: 'SET_ANNOUNCEMENTS', payload: db.announcements });
        if (db.assignments) dispatch({ type: 'SET_ASSIGNMENTS', payload: db.assignments });
        if (db.ddays) dispatch({ type: 'SET_DDAYS', payload: db.ddays });
        if (db.quickLinks) dispatch({ type: 'SET_QUICK_LINKS', payload: db.quickLinks });
        if (db.polls) dispatch({ type: 'SET_POLLS', payload: db.polls });
        if (db.newsletters) dispatch({ type: 'SET_NEWSLETTERS', payload: db.newsletters });
        if (db.weeklyPlans) dispatch({ type: 'SET_WEEKLY_PLANS_BULK', payload: db.weeklyPlans });
        if (db.studentRecords) dispatch({ type: 'SET_STUDENT_RECORDS', payload: db.studentRecords });

        // 출결 기록은 날짜별로 통째로 들고 있다가(monthlyAttendance), 오늘자만 골라 현재 화면에 반영
        const attendanceByDate = db.attendance || {};
        dispatch({ type: 'SET_MONTHLY_ATTENDANCE', payload: attendanceByDate });
        const today = toISODate(new Date());
        const attMap = {};
        (db.students || []).forEach(s => { attMap[s.id] = { status: 'present', note: '' }; });
        Object.assign(attMap, attendanceByDate[today] || {});
        dispatch({ type: 'SET_ATTENDANCE_MAP', payload: attMap });

        if (db.settings) dispatch({ type: 'UPDATE_SETTINGS', payload: db.settings });
      } catch (err) {
        console.error('로컬 데이터 로드 오류:', err);
        showToast('데이터를 불러오는 데 실패했습니다.', 'error');
      } finally {
        setIsDbLoading(false);
      }
    }
    fetchData();

    // 선생님 모드 여부는 이 브라우저에만 저장 (로컬 전용 환경)
    if (localStorage.getItem('isAdmin') === 'true') {
      dispatch({ type: 'TOGGLE_ADMIN', payload: true });
    }
  }, [showToast]);

  // 상태가 바뀔 때마다 로컬 데이터 파일(/api/db)에 저장 (디바운스)
  useEffect(() => {
    if (isDbLoading) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const payload = {
        students: state.students,
        attendance: state.monthlyAttendance,
        announcements: state.announcements,
        assignments: state.assignments,
        ddays: state.ddays,
        polls: state.polls,
        newsletters: state.newsletters,
        quickLinks: state.quickLinks,
        weeklyPlans: state.weeklyPlans,
        studentRecords: state.studentRecords,
        settings: state.settings,
      };
      fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(err => console.error('로컬 저장 오류:', err));
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [state, isDbLoading]);

  const saveWeeklyPlan = useCallback((weekKey, day, period, subject, content) => {
    dispatch({ type: 'SET_WEEKLY_PLAN', payload: { weekKey, day, period, subject, content } });
  }, []);

  const addDDay = (dday) => {
    dispatch({ type: 'ADD_DDAY', payload: { id: generateUUID(), name: dday.name, date: dday.date, emoji: dday.emoji } });
  };

  const deleteDDayFunc = (id) => {
    dispatch({ type: 'DELETE_DDAY', payload: id });
  };

  const updatePointsFunc = (studentId, _currentPoints, amount) => {
    dispatch({ type: 'UPDATE_POINTS', payload: { studentId, amount } });
  };

  const resetPointsFunc = (studentId) => {
    dispatch({ type: 'RESET_POINTS', payload: { studentId } });
  };

  const updateAttendanceFunc = (studentId, status, note = '', date = null) => {
    const targetDate = date || toISODate(new Date());
    dispatch({ type: 'SET_ATTENDANCE', payload: { studentId, status, note, id: '' } });
    dispatch({ type: 'UPDATE_MONTHLY_ATTENDANCE', payload: { date: targetDate, studentId, status, id: '' } });
  };

  // 모든 출결 기록은 이미 monthlyAttendance에 로컬로 전부 들고 있으므로, 서버 조회 없이 바로 조회 가능
  const loadAttendanceByDateFunc = useCallback((date) => {
    dispatch({ type: 'SET_SELECTED_ATTENDANCE_DATE', payload: date });
    const attMap = {};
    state.students.forEach(s => { attMap[s.id] = { status: 'present', note: '' }; });
    Object.assign(attMap, state.monthlyAttendance[date] || {});
    dispatch({ type: 'SET_ATTENDANCE_MAP', payload: attMap });
  }, [state.students, state.monthlyAttendance]);

  // 모든 데이터가 이미 로컬에 로드돼 있어 별도 조회가 필요 없음 (호환성 유지를 위한 빈 함수)
  const loadMonthlyAttendanceFunc = useCallback(() => {}, []);

  const addStudentRecordFunc = (studentId, type, content, category = '') => {
    const date = toISODate(new Date());
    const record = { id: generateUUID(), type, content, category, date };
    dispatch({ type: 'ADD_STUDENT_RECORD', payload: { studentId, record } });
    showToast('기록이 저장되었습니다.', 'success');
  };

  const deleteStudentRecordFunc = (studentId, recordId) => {
    dispatch({ type: 'DELETE_STUDENT_RECORD', payload: { studentId, recordId } });
  };

  const updateStudentFunc = (studentData) => {
    dispatch({ type: 'UPDATE_STUDENT', payload: studentData });
  };

  const bulkUpdateStudentsFunc = (updates) => {
    dispatch({ type: 'BULK_UPDATE_STUDENTS', payload: updates });
  };

  const votePollFunc = (pollId, optionIndex) => {
    const poll = state.polls.find(p => p.id === pollId);
    if (!poll) return;
    const newVotes = [...poll.votes];
    newVotes[optionIndex] += 1;
    dispatch({ type: 'VOTE_POLL', payload: { pollId, newVotes } });
  };

  const collectNewsletterFunc = (id, newCollected) => {
    dispatch({ type: 'COLLECT_NEWSLETTER', payload: { id, collected: newCollected } });
  };

  const addLinkFunc = (linkData) => {
    dispatch({ type: 'ADD_LINK', payload: linkData });
  };

  const updateLinkFunc = (linkData) => {
    dispatch({ type: 'UPDATE_LINK', payload: linkData });
  };

  const deleteLinkFunc = (id) => {
    dispatch({ type: 'DELETE_LINK', payload: id });
  };

  const addAssignmentFunc = (assignment) => {
    dispatch({ type: 'ADD_ASSIGNMENT', payload: assignment });
  };

  const updateAssignmentSubmissionsFunc = (id, submissions) => {
    dispatch({ type: 'UPDATE_ASSIGNMENT_SUBMISSIONS', payload: { id, submissions } });
  };

  const deleteAssignmentFunc = (id) => {
    dispatch({ type: 'DELETE_ASSIGNMENT', payload: id });
  };

  const addAnnouncementFunc = (announcementData) => {
    dispatch({ type: 'ADD_ANNOUNCEMENT', payload: announcementData });
  };

  const updateAnnouncementFunc = (announcementData) => {
    dispatch({ type: 'UPDATE_ANNOUNCEMENT', payload: announcementData });
  };

  const deleteAnnouncementFunc = (id) => {
    dispatch({ type: 'DELETE_ANNOUNCEMENT', payload: id });
  };

  const addPollFunc = (pollData) => {
    dispatch({ type: 'ADD_POLL', payload: pollData });
  };

  const deletePollFunc = (id) => {
    dispatch({ type: 'DELETE_POLL', payload: id });
  };

  const updateSettingsFunc = (newSettings) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
  };

  return (
    <AppContext.Provider value={{
      state, dispatch, showToast,
      updatePoints: updatePointsFunc, resetPoints: resetPointsFunc,
      updateAttendance: updateAttendanceFunc, loadAttendanceByDate: loadAttendanceByDateFunc, loadMonthlyAttendance: loadMonthlyAttendanceFunc,
      updateStudent: updateStudentFunc, bulkUpdateStudents: bulkUpdateStudentsFunc, addStudentRecord: addStudentRecordFunc, deleteStudentRecord: deleteStudentRecordFunc,
      saveWeeklyPlan, updateSettings: updateSettingsFunc, addDDay, deleteDDay: deleteDDayFunc,
      votePoll: votePollFunc, collectNewsletter: collectNewsletterFunc,
      addLink: addLinkFunc, updateLink: updateLinkFunc, deleteLink: deleteLinkFunc,
      addAssignment: addAssignmentFunc, updateAssignmentSubmissions: updateAssignmentSubmissionsFunc, deleteAssignment: deleteAssignmentFunc,
      addAnnouncement: addAnnouncementFunc, updateAnnouncement: updateAnnouncementFunc, deleteAnnouncement: deleteAnnouncementFunc,
      addPoll: addPollFunc, deletePoll: deletePollFunc,
      isDbLoading, getWeekStart, toISODate
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

export { getWeekStart, toISODate };
