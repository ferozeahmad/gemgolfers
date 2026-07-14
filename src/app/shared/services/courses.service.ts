import { Injectable } from "@angular/core";
import { Apollo } from "apollo-angular";
import { Observable } from "rxjs";
import { Course, CourseHoles } from "../models/course.model";
import * as Query from "../GraphQL/course.gql";
import { map } from "rxjs/operators";
//import { promise } from "protractor";

@Injectable({
  providedIn: "root",
})
export class CoursesService {
  constructor(private apollo: Apollo) { }

  public getCoursesList(): Promise<any> {
    return new Promise((resolve) => {
      this.apollo
        .subscribe({
          query: Query.GetCourses,
        })
        .subscribe(({ data }) => {
          if (data == null) {
            resolve(null);
          } else {
            ////console.log(data.course);
            resolve(data);
          }
        });
    });
  }
  public getApprovedCoursesList(): Promise<any> {
    return new Promise((resolve) => {
      this.apollo
        .subscribe({
          query: Query.getApprovedCoursesList,
        })
        .subscribe(({ data }) => {
          if (data == null) {
            resolve(null);
          } else {
            ////console.log(data.course);
            resolve(data);
          }
        });
    });
  }

  public getCoursesListbyID(id: string): Promise<any> {
    return new Promise((resolve) => {
      this.apollo
        .subscribe({
          variables: {
            where: {
              createdBy: {
                _eq: id,
              },
            },
          },
          query: Query.getCoursesListbyID,
        })
        .subscribe(({ data }) => {
          if (data == null) {
            resolve(null);
          } else {
            ////console.log(data.course);
            resolve(data);
          }
        });
    });
  }

  public getCourseByID(id: string): Promise<any> {
    return new Promise((resolve) => {
      this.apollo
        .subscribe<any>({
          query: Query.GetCourseByID,
          variables: {
            where: {
              id: {
                _eq: id,
              },
            },
          },
        })
        .subscribe(({ data }) => {
          resolve(data);
        });
    });
  }
  public getCourseByIDForForm(id: string): Promise<any> {
    return new Promise((resolve) => {
      this.apollo
        .subscribe<any>({
          query: Query.getCourseByIDForForm,
          variables: {
            where: {
              id: {
                _eq: id,
              },
            },
          },
        })
        .subscribe(({ data }) => {
          resolve(data);
        });
    });
  }

  public getCourseByClub(id: string): Promise<Course> {
    return new Promise((resolve) => {
      this.apollo
        .subscribe<any>({
          query: Query.GetCourseByID,
          variables: {
            where: {
              clubId: {
                _eq: id,
              },
            },
          },
        })
        .subscribe(({ data }) => {
          resolve(data);
        });
    });
  }

  public getCourseInformation(id: string): Promise<any> {
    return new Promise((resolve) => {
      this.apollo
        .subscribe({
          query: Query.GetCourseInformation,
          variables: {
            where: {
              id: {
                _eq: id,
              },
            },
          },
        })
        .subscribe(({ data }) => {
          ////console.log(data);
          if (!data) {
            resolve(null);
          } else {
            resolve(data);
          }
        });
    });
  }
  public getCourseTeeMeta(id: string): Promise<any> {
    return new Promise((resolve) => {
      this.apollo
        .subscribe({
          query: Query.getCourseTeeMeta,
          variables: {
            where: {
              course_id: {
                _eq: id,
              },
            },
          },
        })
        .subscribe(({ data }) => {
          ////console.log(data);
          if (!data) {
            resolve(null);
          } else {
            resolve(data);
          }
        });
    });
  }
  public getCourseInformationForForm(id: string): Promise<any> {
    return new Promise((resolve) => {
      this.apollo
        .subscribe({
          query: Query.getCourseInformationForForm,
          variables: {
            where: {
              id: {
                _eq: id,
              },
            },
          },
        })
        .subscribe(({ data }) => {
          ////console.log(data);
          if (!data) {
            resolve(null);
          } else {
            resolve(data);
          }
        });
    });
  }
  public getCourseRating(id: string): Promise<any> {
    return new Promise((resolve) => {
      this.apollo
        .subscribe({
          query: Query.getCourseRating,
          variables: {
            where: {
              courseId: {
                _eq: id,
              },
            },
          },
        })
        .subscribe(({ data }) => {
          ////console.log(data);
          if (!data) {
            resolve(null);
          } else {
            resolve(data);
          }
        });
    });
  }

  getCourseHoleSets(id: string): Observable<any> {
    return this.apollo
      .query<any>({
        query: Query.getCourseHoleSets,
        variables: {
          where: {
            _and: [
              {
                courseId: {
                  _eq: id,
                },
              },
              {
                isActive: {
                  _eq: true,
                },
              }
            ]
          },
        },
      })
      .pipe(map((res) => res.data));
  }
  getCourseHoleSetsForCourse(id: string): Promise<any> {
    return new Promise((resolve) => {
      this.apollo
        .subscribe({
          query: Query.getCourseHoleSets,
          variables: {
            where: {
              _and: [
                {
                  courseId: {
                    _eq: id,
                  },
                  isActive: {
                    _eq: true,
                  },

                }
              ]
            },
          },
        })
        .subscribe(({ data }) => {
          resolve(data);
        });
    });
  }
  getCourseHoleSetsForCourseForm(id: string): Promise<any> {
    return new Promise((resolve) => {
      this.apollo
        .subscribe({
          query: Query.getCourseHoleSetsForCourseForm,
          variables: {
            where: {
              _and: [
                {
                  courseId: {
                    _eq: id,
                  },
                  isActive: {
                    _eq: true,
                  },

                }
              ]
            },
          },
        })
        .subscribe(({ data }) => {
          resolve(data);
        });
    });
  }

  public getCourseHoles(id: string): Array<CourseHoles> {
    const COURSE_HOLES: CourseHoles[] = [
      { id: "1", courseId: "", name: "Hole 1" },
      { id: "2", courseId: "", name: "Hole 2" },
      { id: "3", courseId: "", name: "Hole 3" },
      { id: "4", courseId: "", name: "Hole 4" },
      { id: "5", courseId: "", name: "Hole 5" },
      { id: "6", courseId: "", name: "Hole 6" },
      { id: "7", courseId: "", name: "Hole 7" },
      { id: "8", courseId: "", name: "Hole 8" },
      { id: "9", courseId: "", name: "Hole 9" },
      { id: "10", courseId: "", name: "Hole 10" },
      { id: "11", courseId: "", name: "Hole 11" },
      { id: "12", courseId: "", name: "Hole 12" },
      { id: "13", courseId: "", name: "Hole 13" },
      { id: "14", courseId: "", name: "Hole 14" },
      { id: "15", courseId: "", name: "Hole 15" },
      { id: "16", courseId: "", name: "Hole 16" },
      { id: "17", courseId: "", name: "Hole 17" },
      { id: "18", courseId: "", name: "Hole 18" },
    ];

    return COURSE_HOLES;
  }
  public AddCourse(course): Promise<boolean> {
    return new Promise((resolve) => {
      this.apollo
        .mutate<any>({
          mutation: Query.AddMutation,
          variables: {
            objects: [
              {
                id: course.id,
                clubId: course.clubId,
                name: course.name,
                noOfHoles: course.noOfHoles,
                country: course.country,
                par: course.par,
                city: course.city,
                teeDistanceUnit: course.teeDistanceUnit,
                countryGeonameId: 565656,
                cityGeonameId: 787878,
                createdBy: course.createdBy,
                status: course.status
              },
            ],
          },
        })
        .subscribe(
          ({ data }) => {
            resolve(true);
          },
          (error) => {
            resolve(false);
            //console.log("Could not add due to " + error);
          }
        );
    });
  }
  public updateCourse(course: any, holes: any): Promise<boolean> {
    //console.log(course.id);

    return new Promise((resolve) => {
      this.apollo
        .mutate<any>({
          mutation: Query.UpdateMutation,
          variables: {
            course: course,
            holesToSave: holes,
          },
        })
        .subscribe(
          ({ data }) => {
            resolve(true);
          },
          (error) => {
            resolve(false);
            //console.log("Could not add due to " + error);
          }
        );
    });
  }
  public updateCourseStatus(id: any): Promise<boolean> {
    //console.log(course.id);

    return new Promise((resolve) => {
      this.apollo
        .mutate<any>({
          mutation: Query.UpdateCourseStatus,
          variables: {
            id: id
          },
        })
        .subscribe(
          ({ data }) => {
            resolve(true);
          },
          (error) => {
            resolve(false);
            //console.log("Could not add due to " + error);
          }
        );
    });
  }
  public saveTeeColor(tee: any[]): Promise<boolean> {
    //console.log(tee);

    return new Promise((resolve) => {
      this.apollo
        .mutate<any>({
          mutation: Query.saveColor,
          variables: {
            tee: tee,
          },
        })
        .subscribe(
          ({ data }) => {
            resolve(true);
          },
          (error) => {
            resolve(false);
            //console.log("Could not add due to " + error);
          }
        );
    });
  }
  public deleteTeeColor(courseID, tee: any[]): Promise<boolean> {
    //console.log(tee);

    return new Promise((resolve) => {
      this.apollo
        .mutate<any>({
          mutation: Query.deletecolor,
          variables: {
            deleteTeeExpression: {
              _and: [
                {
                  course_id: {
                    _eq: courseID,
                  },
                },
                {
                  tee_id: {
                    _in: tee,
                  },
                },
              ],
            },
          },
        })
        .subscribe(
          ({ data }) => {
            resolve(true);
          },
          (error) => {
            resolve(false);
            //console.log("Could not add due to " + error);
          }
        );
    });
  }
  public saveHolesANDholeSets(holes: any[], holeSets: any[], holesYardages: any[], holeHazardsToSave: any[]): Promise<boolean> {
    clearInterval;

    return new Promise((resolve) => {
      this.apollo
        .mutate<any>({
          mutation: Query.saveHolesANDholeSets,
          variables: {
            holes: holes,
            holeSets: holeSets,
            holesYardages: holesYardages,
            holeHazardsToSave: holeHazardsToSave
          },
        })
        .subscribe(
          ({ data }) => {
            resolve(true);
          },
          (error) => {
            resolve(false);
            //console.log("Could not add due to " + error);
          }
        );
    });
  }
  public saveholeSets(holeSets: any[]): Promise<boolean> {
    return new Promise((resolve) => {
      this.apollo
        .mutate<any>({
          mutation: Query.saveholeSets,
          variables: {
            holeSets: holeSets,
          },
        })
        .subscribe(
          ({ data }) => {
            resolve(true);
          },
          (error) => {
            resolve(error);
            //console.log("Could not add due to " + error);
          }
        );
    });
  }
  public saveCourseMetaSet(holeSets: any[]): Promise<boolean> {
    return new Promise((resolve) => {
      this.apollo
        .mutate<any>({
          mutation: Query.saveCourseMetaSet,
          variables: {
            holeSets: holeSets,
          },
        })
        .subscribe(
          ({ data }) => {
            resolve(true);
          },
          (error) => {
            resolve(false);
            //console.log("Could not add due to " + error);
          }
        );
    });
  }
  public saveCourseRating(holeSets: any[]): Promise<boolean> {
    clearInterval;

    return new Promise((resolve) => {
      this.apollo
        .mutate<any>({
          mutation: Query.saveCourseRating,
          variables: {
            holeSets: holeSets,
          },
        })
        .subscribe(
          ({ data }) => {
            resolve(true);
          },
          (error) => {
            resolve(false);
            //console.log("Could not add due to " + error);
          }
        );
    });
  }
  public getTeesOfCourse(courseId: any): Promise<any> {
    return new Promise((resolve) => {
      this.apollo
        .subscribe({
          query: Query.getTeesOfCourse,
          variables: {
            where: {
              course_id: {
                _eq: courseId,
              },
            },
          },
        })
        .subscribe(
          ({ data }) => {
            resolve(data);
          },
          (error) => {
            console.log("Could not add due to " + error);
            resolve(false);
          }
        );
    });
  }
  public getCourseHole(courseId: any): Promise<any> {
    return new Promise((resolve) => {
      this.apollo
        .subscribe({
          query: Query.getCourseHole,
          variables: {
            where: {
              courseId: {
                _eq: courseId,
              },
              noOfHoles: {
                _eq: 9,
              },
            },
          },
        })
        .subscribe(
          ({ data }) => {
            resolve(data);
          },
          (error) => {
            resolve(false);
            //console.log("Could not add due to " + error);
          }
        );
    });
  }
}
