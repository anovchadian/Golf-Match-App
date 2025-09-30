import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CourseForm } from './CourseForm';
import { Course } from '@/lib/types';
import { mockDb } from '@/lib/store/mockDb';
import { useToast } from '@/components/ui/use-toast';

export function CourseManagement() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  function loadCourses() {
    const allCourses = mockDb.getCourses();
    setCourses(allCourses);
  }

  function handleAddCourse() {
    setEditingCourse(null);
    setDialogOpen(true);
  }

  function handleEditCourse(course: Course) {
    setEditingCourse(course);
    setDialogOpen(true);
  }

  function handleDeleteCourse(course: Course) {
    setDeletingCourse(course);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (!deletingCourse) return;

    const success = mockDb.deleteCourse(deletingCourse.id);
    if (success) {
      toast({
        title: 'Course Deleted',
        description: `${deletingCourse.name} has been removed.`,
      });
      loadCourses();
    } else {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete course.',
        variant: 'destructive',
      });
    }

    setDeleteDialogOpen(false);
    setDeletingCourse(null);
  }

  function handleSaveCourse(data: Omit<Course, 'id'>) {
    if (editingCourse) {
      const updated = mockDb.updateCourse(editingCourse.id, data);
      if (updated) {
        toast({
          title: 'Course Updated',
          description: `${data.name} has been updated successfully.`,
        });
      }
    } else {
      mockDb.createCourse(data);
      toast({
        title: 'Course Created',
        description: `${data.name} has been added successfully.`,
      });
    }

    setDialogOpen(false);
    setEditingCourse(null);
    loadCourses();
  }

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Course Management</CardTitle>
              <CardDescription>
                Add, edit, and manage golf courses
              </CardDescription>
            </div>
            <Button onClick={handleAddCourse} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Course
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses by name, city, or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Tee Sets</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No courses found matching your search' : 'No courses yet. Add your first course to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCourses.map((course) => {
                    const teeCount = mockDb.getTees(course.id).length;
                    return (
                      <TableRow key={course.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {course.imageUrl && (
                              <img
                                src={course.imageUrl}
                                alt={course.name}
                                className="h-10 w-16 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-semibold">{course.name}</p>
                              <p className="text-sm text-muted-foreground">{course.address}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span>{course.city}, {course.state}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {course.lat.toFixed(4)}, {course.lng.toFixed(4)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={teeCount > 0 ? 'default' : 'secondary'}>
                            {teeCount} tee{teeCount !== 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCourse(course)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCourse(course)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? 'Edit Course' : 'Add New Course'}
            </DialogTitle>
            <DialogDescription>
              {editingCourse 
                ? 'Update the course information below' 
                : 'Enter the details for the new golf course'}
            </DialogDescription>
          </DialogHeader>
          <CourseForm
            course={editingCourse}
            onSave={handleSaveCourse}
            onCancel={() => {
              setDialogOpen(false);
              setEditingCourse(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingCourse?.name}</strong>? 
              This will also delete all associated tee sets and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}