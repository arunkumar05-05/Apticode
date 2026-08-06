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
  aiMetricsList: any[] = [];
  aiProviderHealthList: any[] = [];

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
  aiMetrics = this.createRepository('aiMetricsList');
  aiProviderHealth = this.createRepository('aiProviderHealthList');

  private createRepository(arrayName: string) {
    const getArray = () => (this as any)[arrayName] as any[];

    // Prisma nested-create shapes (e.g. `testcases: { create: [...] }`) have
    // no direct memory analog. Flatten them into plain arrays on write so
    // include-reads return arrays (matching Prisma semantics).
    const flattenNestedArrays = (data: any) => {
      if (!data || typeof data !== 'object') return data;
      const out = { ...data };
      if (out.testcases && typeof out.testcases === 'object' && !Array.isArray(out.testcases)) {
        const created = out.testcases.create;
        if (Array.isArray(created)) {
          out.testcases = created.map((tc: any) => ({
            id: Math.random().toString(36).substring(2, 11),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...tc,
          }));
        }
      }
      return out;
    };

    // Apply `include` relations that matter to reads: testcases (as arrays)
    // and problem (the owning CodingProblem) on submissions.
    const applyIncludes = (item: any, args: any) => {
      if (!item || !args?.include) return item;
      const include = args.include;
      if (include.testcases && item.testcases && !Array.isArray(item.testcases)) {
        const created = item.testcases.create;
        if (Array.isArray(created)) {
          item = { ...item, testcases: created };
        }
      }
      if (include.problem && item.problemId) {
        const problems = (this as any).codingProblems as any[];
        const problem = problems.find((p: any) => p.id === item.problemId) || null;
        item = { ...item, problem };
      }
      return item;
    };

    return {
      findUnique: async (args: any) => {
        const arr = getArray();
        const where = args.where;
        // Handle compound keys or nested objects like userId_topicId
        const found = arr.find(item => {
          return Object.keys(where).every(key => {
            if (typeof where[key] === 'object' && where[key] !== null) {
              return Object.keys(where[key]).every(subKey => item[subKey] === where[key][subKey]);
            }
            return item[key] === where[key];
          });
        }) || null;
        return applyIncludes(found, args);
      },
      findFirst: async (args: any) => {
        const arr = getArray();
        const where = args?.where || {};
        const found = arr.find(item => {
          return Object.keys(where).every(key => item[key] === where[key]);
        }) || null;
        return applyIncludes(found, args);
      },
      findMany: async (args: any) => {
        let arr = [...getArray()];
        const where = args?.where;
        if (where) {
          arr = arr.filter(item => {
            return Object.keys(where).every(key => item[key] === where[key]);
          });
        }
        arr = arr.map(item => applyIncludes(item, args));
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
          ...flattenNestedArrays(args.data)
        };
        arr.push(newItem);
        return applyIncludes(newItem, args);
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
          ...flattenNestedArrays(args.data),
          updatedAt: new Date()
        };
        arr[index] = updated;
        return applyIncludes(updated, args);
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
            ...flattenNestedArrays(args.update),
            updatedAt: new Date()
          };
          arr[index] = updated;
          return applyIncludes(updated, args);
        } else {
          const newItem = {
            id: Math.random().toString(36).substring(2, 11),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...flattenNestedArrays(args.create)
          };
          arr.push(newItem);
          return applyIncludes(newItem, args);
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
