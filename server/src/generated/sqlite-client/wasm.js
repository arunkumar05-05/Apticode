
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  passwordHash: 'passwordHash',
  firebaseUid: 'firebaseUid',
  authProvider: 'authProvider',
  fullName: 'fullName',
  role: 'role',
  level: 'level',
  xp: 'xp',
  isEmailVerified: 'isEmailVerified',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  fullName: 'fullName',
  email: 'email',
  phone: 'phone',
  college: 'college',
  branch: 'branch',
  graduationYear: 'graduationYear',
  registerNumber: 'registerNumber',
  skills: 'skills',
  bio: 'bio',
  github: 'github',
  linkedin: 'linkedin',
  portfolio: 'portfolio',
  profilePhoto: 'profilePhoto',
  resume: 'resume',
  placementReadinessIndex: 'placementReadinessIndex',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RefreshTokenScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  token: 'token',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.AptitudeTopicScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  category: 'category',
  createdAt: 'createdAt'
};

exports.Prisma.AptitudeVideoScalarFieldEnum = {
  id: 'id',
  topicId: 'topicId',
  title: 'title',
  url: 'url',
  duration: 'duration',
  youtubeVideoId: 'youtubeVideoId',
  createdAt: 'createdAt'
};

exports.Prisma.AptitudeNotesScalarFieldEnum = {
  id: 'id',
  topicId: 'topicId',
  content: 'content',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AptitudeQuestionScalarFieldEnum = {
  id: 'id',
  topicId: 'topicId',
  questionText: 'questionText',
  optionA: 'optionA',
  optionB: 'optionB',
  optionC: 'optionC',
  optionD: 'optionD',
  correctOption: 'correctOption',
  explanation: 'explanation',
  difficulty: 'difficulty',
  createdAt: 'createdAt'
};

exports.Prisma.UserBookmarkScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  questionId: 'questionId',
  createdAt: 'createdAt'
};

exports.Prisma.UserTopicProgressScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  topicId: 'topicId',
  videosCompleted: 'videosCompleted',
  notesCompleted: 'notesCompleted',
  quizScore: 'quizScore',
  completedAt: 'completedAt'
};

exports.Prisma.CodingProblemScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  timeLimitMs: 'timeLimitMs',
  memoryLimitKb: 'memoryLimitKb',
  difficulty: 'difficulty',
  editorial: 'editorial',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CodingTestcaseScalarFieldEnum = {
  id: 'id',
  problemId: 'problemId',
  inputData: 'inputData',
  expectedOutput: 'expectedOutput',
  isHidden: 'isHidden',
  createdAt: 'createdAt'
};

exports.Prisma.CodingSubmissionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  problemId: 'problemId',
  code: 'code',
  status: 'status',
  executionMs: 'executionMs',
  memoryKb: 'memoryKb',
  createdAt: 'createdAt'
};

exports.Prisma.CommunicationSessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  sessionType: 'sessionType',
  transcript: 'transcript',
  wpm: 'wpm',
  grammarScore: 'grammarScore',
  fluencyScore: 'fluencyScore',
  confidence: 'confidence',
  createdAt: 'createdAt'
};

exports.Prisma.MockInterviewScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  interviewType: 'interviewType',
  overallScore: 'overallScore',
  technicalScore: 'technicalScore',
  softSkillScore: 'softSkillScore',
  createdAt: 'createdAt'
};

exports.Prisma.InterviewMessageScalarFieldEnum = {
  id: 'id',
  interviewId: 'interviewId',
  sender: 'sender',
  messageText: 'messageText',
  createdAt: 'createdAt'
};

exports.Prisma.UserAttemptScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  topicId: 'topicId',
  score: 'score',
  accuracy: 'accuracy',
  timeTaken: 'timeTaken',
  incorrectQuestions: 'incorrectQuestions',
  topicPerformance: 'topicPerformance',
  completedAt: 'completedAt'
};

exports.Prisma.ResumeScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  versionName: 'versionName',
  contentJson: 'contentJson',
  atsScore: 'atsScore',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  User: 'User',
  Profile: 'Profile',
  RefreshToken: 'RefreshToken',
  AptitudeTopic: 'AptitudeTopic',
  AptitudeVideo: 'AptitudeVideo',
  AptitudeNotes: 'AptitudeNotes',
  AptitudeQuestion: 'AptitudeQuestion',
  UserBookmark: 'UserBookmark',
  UserTopicProgress: 'UserTopicProgress',
  CodingProblem: 'CodingProblem',
  CodingTestcase: 'CodingTestcase',
  CodingSubmission: 'CodingSubmission',
  CommunicationSession: 'CommunicationSession',
  MockInterview: 'MockInterview',
  InterviewMessage: 'InterviewMessage',
  UserAttempt: 'UserAttempt',
  Resume: 'Resume'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
