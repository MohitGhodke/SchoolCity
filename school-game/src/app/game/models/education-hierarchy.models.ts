// Models for the educational hierarchy in the SchoolCity game

export interface Student {
  id: string;
  name: string;
  age: number;
  // Add more properties as needed
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  // Add more properties as needed
}

export interface Group {
  id: string;
  name: string;
  students: Student[];
}

export interface SchoolClass {
  id: string;
  name: string;
  groups: Group[];
  teacher: Teacher | null;
}

export interface School {
  id: string;
  name: string;
  classes: SchoolClass[];
  specialization?: string; // e.g., "Dance", "Science"
}

export interface Unit {
  id: string;
  name: string;
  schools: School[];
}

export interface Area {
  id: string;
  name: string;
  units: Unit[];
}

export interface Municipality {
  id: string;
  name: string;
  areas: Area[];
}
