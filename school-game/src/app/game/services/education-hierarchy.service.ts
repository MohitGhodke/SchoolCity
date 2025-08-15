import { Injectable } from '@angular/core';
import { Municipality, Area, Unit, School, SchoolClass, Group, Student, Teacher } from '../models/education-hierarchy.models';

@Injectable({
  providedIn: 'root'
})
export class EducationHierarchyService {
  private municipalities: Municipality[] = [];

  // --- Municipality Level ---
  getMunicipalities(): Municipality[] {
    return this.municipalities;
  }

  addMunicipality(municipality: Municipality): void {
    this.municipalities.push(municipality);
  }

  removeMunicipality(id: string): void {
    this.municipalities = this.municipalities.filter(m => m.id !== id);
  }

  // --- Area Level ---
  addArea(municipalityId: string, area: Area): void {
    const municipality = this.municipalities.find(m => m.id === municipalityId);
    if (municipality) {
      municipality.areas.push(area);
    }
  }

  // --- Unit Level ---
  addUnit(municipalityId: string, areaId: string, unit: Unit): void {
    const area = this.findArea(municipalityId, areaId);
    if (area) {
      area.units.push(unit);
    }
  }

  // --- School Level ---
  addSchool(municipalityId: string, areaId: string, unitId: string, school: School): void {
    const unit = this.findUnit(municipalityId, areaId, unitId);
    if (unit) {
      unit.schools.push(school);
    }
  }

  // --- Class Level ---
  addClass(municipalityId: string, areaId: string, unitId: string, schoolId: string, schoolClass: SchoolClass): void {
    const school = this.findSchool(municipalityId, areaId, unitId, schoolId);
    if (school) {
      school.classes.push(schoolClass);
    }
  }

  // --- Group Level ---
  addGroup(municipalityId: string, areaId: string, unitId: string, schoolId: string, classId: string, group: Group): void {
    const schoolClass = this.findClass(municipalityId, areaId, unitId, schoolId, classId);
    if (schoolClass) {
      schoolClass.groups.push(group);
    }
  }

  // --- Student/Teacher Management ---
  addStudentToGroup(municipalityId: string, areaId: string, unitId: string, schoolId: string, classId: string, groupId: string, student: Student): void {
    const group = this.findGroup(municipalityId, areaId, unitId, schoolId, classId, groupId);
    if (group) {
      group.students.push(student);
    }
  }

  assignTeacherToClass(municipalityId: string, areaId: string, unitId: string, schoolId: string, classId: string, teacher: Teacher): void {
    const schoolClass = this.findClass(municipalityId, areaId, unitId, schoolId, classId);
    if (schoolClass) {
      schoolClass.teacher = teacher;
    }
  }

  // --- Finders ---
  private findArea(municipalityId: string, areaId: string): Area | undefined {
    return this.municipalities.find(m => m.id === municipalityId)?.areas.find(a => a.id === areaId);
  }

  private findUnit(municipalityId: string, areaId: string, unitId: string): Unit | undefined {
    return this.findArea(municipalityId, areaId)?.units.find(u => u.id === unitId);
  }

  private findSchool(municipalityId: string, areaId: string, unitId: string, schoolId: string): School | undefined {
    return this.findUnit(municipalityId, areaId, unitId)?.schools.find(s => s.id === schoolId);
  }

  private findClass(municipalityId: string, areaId: string, unitId: string, schoolId: string, classId: string): SchoolClass | undefined {
    return this.findSchool(municipalityId, areaId, unitId, schoolId)?.classes.find(c => c.id === classId);
  }

  private findGroup(municipalityId: string, areaId: string, unitId: string, schoolId: string, classId: string, groupId: string): Group | undefined {
    return this.findClass(municipalityId, areaId, unitId, schoolId, classId)?.groups.find(g => g.id === groupId);
  }
}
