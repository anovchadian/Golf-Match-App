import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TeeForm } from './TeeForm';
import { Course, Tee } from '@/lib/types';
import { mockDb } from '@/lib/store/mockDb';
import { useToast } from '@/components/ui/use-toast';

export function TeeManagement() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [tees, setTees] = useState<Tee[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTee, setEditingTee] = useState<Tee | null>(null);
  const [deletingTee, setDeletingTee] = useState<Tee | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    const allCourses = mockDb.getCourses();
    const allTees = mockDb.getTees();
    setCourses(allCourses);
    setTees(allTees);
  }

  function handleAddTee() {
    setEditingTee(null);
    setDialogOpen(true);
  }

  function handleEditTee(tee: Tee) {
    setEditingTee(tee);
    setDialogOpen(true);
  }

  function handleDeleteTee(tee: Tee) {
    setDeletingTee(tee);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (!deletingTee) return;

    const success = mockDb.deleteTee(deletingTee.id);
    if (success) {
      toast({
        title: 'Tee Set Deleted',
        description: `${deletingTee.name} tees have been removed.`,
      });
      loadData();
    } else {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete tee set.',
        variant: 'destructive',
      });
    }

    setDeleteDialogOpen(false);
    setDeletingTee(null);
  }

  function handleSaveTee(data: Omit<Tee, 'id'>) {
    if (editingTee) {
      const updated = mockDb.updateTee(editingTee.id, data);
      if (updated) {
        toast({
          title: 'Tee Set Updated',
          description: `${data.name} tees have been updated successfully.`,
        });
      }
    } else {
      mockDb.createTee(data);
      toast({
        title: 'Tee Set Created',
        description: `${data.name} tees have been added successfully.`,
      });
    }

    setDialogOpen(false);
    setEditingTee(null);
    loadData();
  }

  const filteredTees = tees.filter(tee => {
    const matchesCourse = selectedCourseId === 'all' || tee.courseId === selectedCourseId;
    const matchesSearch = tee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tee.color.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  function getCourseName(courseId: string): string {
    return courses.find(c => c.id === courseId)?.name || 'Unknown Course';
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tee Set Management</CardTitle>
              <CardDescription>
                Add, edit, and manage tee sets for each course
              </CardDescription>
            </div>
            <Button onClick={handleAddTee} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Tee Set
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tee sets by name or color..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Tee Name</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Rating/Slope</TableHead>
                  <TableHead>Par</TableHead>
                  <TableHead>Yardage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchQuery || selectedCourseId !== 'all' 
                        ? 'No tee sets found matching your filters' 
                        : 'No tee sets yet. Add your first tee set to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTees.map((tee) => (
                    <TableRow key={tee.id}>
                      <TableCell>
                        <div className="font-medium">{getCourseName(tee.courseId)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{tee.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tee.color}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{tee.rating} / {tee.slope}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{tee.par}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{tee.yardage} yds</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditTee(tee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTee(tee)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTee ? 'Edit Tee Set' : 'Add New Tee Set'}
            </DialogTitle>
            <DialogDescription>
              {editingTee 
                ? 'Update the tee set information below' 
                : 'Enter the details for the new tee set'}
            </DialogDescription>
          </DialogHeader>
          <TeeForm
            tee={editingTee}
            courses={courses}
            onSave={handleSaveTee}
            onCancel={() => {
              setDialogOpen(false);
              setEditingTee(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tee Set</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the <strong>{deletingTee?.name}</strong> tees 
              from <strong>{deletingTee ? getCourseName(deletingTee.courseId) : ''}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Tee Set
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}