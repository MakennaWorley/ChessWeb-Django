export interface Player {
    id: number; // Assuming Django uses an auto-increment primary key
    name: string;
    rating: number;
    beginningRating: number | null;
    improvedRating: number | null;
    grade: number | null;
    lessonClass: number | null; // Foreign key to LessonClass by ID
    activeMember: boolean;
    isVolunteer: boolean;
    parentOrGuardian: string | null;
    email: string | null;
    phone: string | null;
    additionalInfo: string | null;
    opponentOne: number | null; // Self-referential foreign key by ID
    opponentTwo: number | null;
    opponentThree: number | null;
    modifiedBy: number; // Foreign key to User by ID
    isActive: boolean;
    createdAt: string; // ISO Date string
    endAt: string | null; // ISO Date string
}

export interface LessonClass {
    id: number; // Assuming Django uses an auto-increment primary key
    name: string;
    teacher: number; // Foreign key to Player by ID
    coTeacher: number | null; // Foreign key to Player by ID
    modifiedBy: number; // Foreign key to User by ID
    isActive: boolean;
    createdAt: string; // ISO Date string
    endAt: string | null; // ISO Date string
}

export interface RegisteredUser {
    id: number; // Assuming Django uses an auto-increment primary key
    user: number; // Foreign key to User by ID
    isDirector: boolean;
}

export interface Game {
    id: number | null; // Assuming Django uses an auto-increment primary key
    dateOfMatch: string; // ISO Date string
    white: number | null; // Foreign key to Player by ID
    black: number | null; // Foreign key to Player by ID
    boardLetter: string;
    boardNumber: number;
    result: "White" | "Black" | "Draw" | "U" | null; // Enum based on TextChoices
    modifiedBy: number | null; // Foreign key to User by ID
    isActive: boolean | null;
    createdAt: string | null; // ISO Date string
    endAt: string | null; // ISO Date string
}