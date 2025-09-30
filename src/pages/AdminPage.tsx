import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Target, Shield, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CourseManagement } from '@/components/admin/CourseManagement';
import { TeeManagement } from '@/components/admin/TeeManagement';

export function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('courses');

  return (
    <div className="container py-8 max-w-7xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Discover
        </Button>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
            <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage courses, tees, and system configuration
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Courses
            </CardDescription>
            <CardTitle className="text-3xl">
              {/* Will be populated dynamically */}
              -
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Total golf courses
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Tee Sets
            </CardDescription>
            <CardTitle className="text-3xl">
              -
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Total tee configurations
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Status
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              System operational
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="tees" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Tee Sets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <CourseManagement />
        </TabsContent>

        <TabsContent value="tees" className="space-y-4">
          <TeeManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}