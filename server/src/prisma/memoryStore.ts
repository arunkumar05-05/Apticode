export class InMemoryStore {
  users: any[] = [];
  profiles: any[] = [];
  refreshTokens: any[] = [];
  aptitudeTopics: any[] = [];
  aptitudeVideos: any[] = [];
  aptitudeNotes: any[] = [];
  aptitudeQuestions: any[] = [];
  userBookmarks: any[] = [];
  userTopicProgresses: any[] = [];
  codingProblems: any[] = [];
  codingSubmissions: any[] = [];
  communicationSessions: any[] = [];
  mockInterviews: any[] = [];
  interviewMessages: any[] = [];
  userAttempts: any[] = [];
  resumes: any[] = [];
  xpLogs: any[] = [];
  leaderboards: any[] = [];
  notifications: any[] = [];
  sessions: any[] = [];
  auditLogs: any[] = [];
  passwordResetTokens: any[] = [];
  emailVerificationTokens: any[] = [];

  // Implement generic repositories
  user = this.createRepository('users');
  profile = this.createRepository('profiles');
  refreshToken = this.createRepository('refreshTokens');
  aptitudeTopic = this.createRepository('aptitudeTopics');
  aptitudeQuestion = this.createRepository('aptitudeQuestions');
  userBookmark = this.createRepository('userBookmarks');
  userTopicProgress = this.createRepository('userTopicProgresses');
  codingProblem = this.createRepository('codingProblems');
  codingSubmission = this.createRepository('codingSubmissions');
  communicationSession = this.createRepository('communicationSessions');
  mockInterview = this.createRepository('mockInterviews');
  interviewMessage = this.createRepository('interviewMessages');
  userAttempt = this.createRepository('userAttempts');
  resume = this.createRepository('resumes');
  xpLog = this.createRepository('xpLogs');
  leaderboard = this.createRepository('leaderboards');
  notification = this.createRepository('notifications');
  session = this.createRepository('sessions');
  authAuditLog = this.createRepository('auditLogs');
  passwordResetToken = this.createRepository('passwordResetTokens');
  emailVerificationToken = this.createRepository('emailVerificationTokens');

  private createRepository(arrayName: string) {
    const getArray = () => (this as any)[arrayName] as any[];
    
    return {
      findUnique: async (args: any) => {
        const arr = getArray();
        const where = args.where;
        // Handle compound keys or nested objects like userId_topicId
        return arr.find(item => {
          return Object.keys(where).every(key => {
            if (typeof where[key] === 'object' && where[key] !== null) {
              return Object.keys(where[key]).every(subKey => item[subKey] === where[key][subKey]);
            }
            return item[key] === where[key];
          });
        }) || null;
      },
      findFirst: async (args: any) => {
        const arr = getArray();
        const where = args?.where || {};
        return arr.find(item => {
          return Object.keys(where).every(key => item[key] === where[key]);
        }) || null;
      },
      findMany: async (args: any) => {
        let arr = [...getArray()];
        const where = args?.where;
        if (where) {
          arr = arr.filter(item => {
            return Object.keys(where).every(key => item[key] === where[key]);
          });
        }
        if (args?.orderBy) {
          const field = Object.keys(args.orderBy)[0];
          const dir = args.orderBy[field];
          arr.sort((a, b) => {
            if (a[field] < b[field]) return dir === 'desc' ? 1 : -1;
            if (a[field] > b[field]) return dir === 'desc' ? -1 : 1;
            return 0;
          });
        }
        return arr;
      },
      create: async (args: any) => {
        const arr = getArray();
        const newItem = {
          id: Math.random().toString(36).substring(2, 11),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        arr.push(newItem);
        return newItem;
      },
      update: async (args: any) => {
        const arr = getArray();
        const where = args.where;
        const index = arr.findIndex(item => {
          return Object.keys(where).every(key => item[key] === where[key]);
        });
        if (index === -1) throw new Error(`Record not found in memory store for update`);
        const updated = {
          ...arr[index],
          ...args.data,
          updatedAt: new Date()
        };
        arr[index] = updated;
        return updated;
      },
      updateMany: async (args: any) => {
        const arr = getArray();
        const where = args?.where || {};
        const data = args.data || {};
        let count = 0;
        for (const item of arr) {
          const matched = Object.keys(where).every(key => {
            if (typeof where[key] === 'object' && where[key] !== null) {
              return Object.keys(where[key]).every(subKey => item[subKey] === where[key][subKey]);
            }
            return item[key] === where[key];
          });
          if (matched) {
            Object.assign(item, data, { updatedAt: new Date() });
            count++;
          }
        }
        return { count };
      },
      upsert: async (args: any) => {
        const arr = getArray();
        const where = args.where;
        const index = arr.findIndex(item => {
          return Object.keys(where).every(key => {
            if (typeof where[key] === 'object' && where[key] !== null) {
              return Object.keys(where[key]).every(subKey => item[subKey] === where[key][subKey]);
            }
            return item[key] === where[key];
          });
        });
        if (index !== -1) {
          const updated = {
            ...arr[index],
            ...args.update,
            updatedAt: new Date()
          };
          arr[index] = updated;
          return updated;
        } else {
          const newItem = {
            id: Math.random().toString(36).substring(2, 11),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...args.create
          };
          arr.push(newItem);
          return newItem;
        }
      },
      delete: async (args: any) => {
        const arr = getArray();
        const where = args.where;
        const index = arr.findIndex(item => {
          return Object.keys(where).every(key => item[key] === where[key]);
        });
        if (index === -1) throw new Error('Record not found in memory store for delete');
        const deleted = arr.splice(index, 1)[0];
        return deleted;
      },
      deleteMany: async (args: any) => {
        const arr = getArray();
        const where = args?.where || {};
        const matched = arr.filter(item =>
          Object.keys(where).every(key => {
            if (typeof where[key] === 'object' && where[key] !== null) {
              return Object.keys(where[key]).every(subKey => item[subKey] === where[key][subKey]);
            }
            return item[key] === where[key];
          })
        );
        // Remove matched in place; memory arrays are the source of truth.
        for (let i = arr.length - 1; i >= 0; i--) {
          if (matched.includes(arr[i])) arr.splice(i, 1);
        }
        return { count: matched.length };
      },
      count: async (args: any) => {
        const arr = getArray();
        const where = args?.where;
        if (!where) return arr.length;
        return arr.filter(item => {
          return Object.keys(where).every(key => item[key] === where[key]);
        }).length;
      }
    };
  }
}
