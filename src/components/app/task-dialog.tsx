

'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, PlusCircle, Send, Trash2, UploadCloud, File, Image as ImageIcon, FileText, FileQuestion } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Task, SubTask, Comment, Attachment, Release } from '@/lib/types';
import { PHASES, PRIORITIES, STATUSES } from '@/lib/constants';
import { useEffect, useMemo, useState } from 'react';
import { Separator } from '../ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Combobox } from '../ui/combobox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { UserAvatar } from './user-avatar';
import { Badge } from '../ui/badge';

const attachmentSchema = z.object({
  name: z.string(),
  url: z.string(),
  type: z.string(),
});

const subTaskSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Sub-task name cannot be empty'),
  completed: z.boolean(),
});

const commentSchema = z.object({
  id: z.string(),
  author: z.string(),
  authorId: z.string(),
  text: z.string(),
  createdAt: z.date(),
});

const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().min(1, 'Description is required'),
  assignedTo: z.string().min(1, 'Assignee is required'),
  assignedToId: z.string().optional(),
  priority: z.enum(['High', 'Medium', 'Low']),
  estimatedHours: z.coerce.number().min(0, 'Must be a positive number'),
  startDate: z.date(),
  endDate: z.date(),
  status: z.enum(['To Do', 'In Progress', 'Testing', 'Completed', 'Blocked']),
  percentComplete: z.number().min(0).max(100),
  dependencies: z.string().optional(),
  notes: z.string().optional(),
  phase: z.string().min(1, 'Phase is required'),
  subTasks: z.array(subTaskSchema).optional(),
  comments: z.array(commentSchema).optional(),
  attachments: z.array(attachmentSchema).optional(),
  projectId: z.string().min(1, 'Project is required'),
  releaseId: z.string().min(1, 'Release is required'),
});

type TaskFormValues = z.infer<typeof taskSchema>;

type TaskDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (task: Task) => void;
  taskToEdit?: Task | null;
  tasks: Task[];
  defaultTab?: string;
  projectId?: string; // Add projectId prop
  releaseId?: string | null;
};

const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-6 w-6 text-primary" />;
    if (fileType === 'application/pdf') return <FileText className="h-6 w-6 text-red-500" />;
    if (fileType.includes('document')) return <File className="h-6 w-6 text-blue-500" />;
    return <FileQuestion className="h-6 w-6 text-muted-foreground" />;
};


export function TaskDialog({ isOpen, onOpenChange, onSave, taskToEdit, tasks, defaultTab = "details", projectId, releaseId }: TaskDialogProps) {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<{label: string, value: string}[]>([]);
  const [projects, setProjects] = useState<{label: string, value: string}[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: '',
      description: '',
      assignedTo: '',
      assignedToId: '',
      priority: 'Medium',
      estimatedHours: 8,
      startDate: new Date(),
      endDate: new Date(),
      status: 'To Do',
      percentComplete: 0,
      dependencies: '',
      notes: '',
      phase: '',
      subTasks: [],
      comments: [],
      attachments: [],
      projectId: '',
      releaseId: '',
    },
  });

  const selectedProjectId = form.watch('projectId');
  const percentCompleteValue = form.watch('percentComplete');

  useEffect(() => {
    if (percentCompleteValue === 100) {
        if (form.getValues('status') !== 'Completed') {
           form.setValue('status', 'Testing');
        }
    }
  }, [percentCompleteValue, form]);

  useEffect(() => {
    const fetchUsers = async () => {
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef);
        const userList = usersSnap.docs.map(doc => ({
            value: doc.data().displayName,
            label: doc.data().displayName,
        }));
        setTeamMembers(userList);
    };
    const fetchProjects = async () => {
        if (projectId) {
            const projectDoc = await getDocs(query(collection(db, 'projects'), where('__name__', '==', projectId)));
            if (!projectDoc.empty) {
                setProjects([{ value: projectDoc.docs[0].id, label: projectDoc.docs[0].data().name }]);
            }
            return;
        }
        const projectsRef = collection(db, 'projects');
        const projectsSnap = await getDocs(projectsRef);
        const projectList = projectsSnap.docs.map(doc => ({
            value: doc.id,
            label: doc.data().name,
        }));
        setProjects(projectList);
    };
    if (isOpen) {
        fetchUsers();
        fetchProjects();
        setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab, projectId]);
  
  useEffect(() => {
    if (selectedProjectId) {
      const releasesQuery = query(collection(db, 'projects', selectedProjectId, 'releases'));
      const unsubscribe = onSnapshot(releasesQuery, (snapshot) => {
        const releasesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Release));
        setReleases(releasesData);
      });
      return () => unsubscribe();
    } else {
        setReleases([]);
    }
  }, [selectedProjectId]);


  const { fields: subTaskFields, append: appendSubTask, remove: removeSubTask } = useFieldArray({
    control: form.control,
    name: "subTasks",
  });

  const { fields: commentFields, append: appendComment } = useFieldArray({
    control: form.control,
    name: "comments"
  });

  const { fields: attachmentFields, append: appendAttachment, remove: removeAttachment } = useFieldArray({
    control: form.control,
    name: "attachments"
  });

  useEffect(() => {
    if (taskToEdit) {
      form.reset({
        ...taskToEdit,
        projectId: taskToEdit.projectId || projectId || '',
        releaseId: taskToEdit.releaseId || releaseId || '',
        startDate: new Date(taskToEdit.startDate),
        endDate: new Date(taskToEdit.endDate),
        percentComplete: taskToEdit.percentComplete || 0,
        subTasks: taskToEdit.subTasks || [],
        comments: taskToEdit.comments?.map(c => ({...c, createdAt: new Date(c.createdAt)})) || [],
        attachments: taskToEdit.attachments || [],
      });
    } else {
      form.reset({
        name: '',
        description: '',
        assignedTo: user?.displayName || '',
        assignedToId: user?.uid || '',
        priority: 'Medium',
        estimatedHours: 8,
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        status: 'To Do',
        percentComplete: 0,
        dependencies: '',
        notes: '',
        phase: PHASES[0],
        subTasks: [],
        comments: [],
        attachments: [],
        projectId: projectId || '',
        releaseId: releaseId || '',
      });
    }
  }, [taskToEdit, form, isOpen, user, projectId, releaseId]);

  const handleAddComment = () => {
    if (newComment.trim() && user) {
        appendComment({
            id: `new-${Date.now()}`,
            author: user.displayName || 'Unknown User',
            authorId: user.uid,
            text: newComment.trim(),
            createdAt: new Date(),
        });
        setNewComment("");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      for (const file of files) {
        // In a real app, you would upload to Firebase Storage and get a URL.
        // For this prototype, we'll use a placeholder URL and object URL for preview.
        // This part would need to be replaced with actual upload logic.
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
            appendAttachment({
              name: file.name,
              url: e.target?.result as string, // This is a data URI
              type: file.type,
            });
        };
        fileReader.readAsDataURL(file);
      }
    }
  };

  const onSubmit = async (values: TaskFormValues) => {
    const assignedToName = values.assignedTo;
    let assignedToId = '';

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("displayName", "==", assignedToName));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        assignedToId = querySnapshot.docs[0].id;
    }

    onSave({
      ...values,
      assignedToId,
      id: taskToEdit?.id || new Date().toISOString(),
      subTasks: values.subTasks,
      attachments: values.attachments,
    });
    onOpenChange(false);
  };

  const commentCount = form.watch('comments')?.length || 0;
  const attachmentCount = form.watch('attachments')?.length || 0;
  const hasSubtasks = (form.watch('subTasks')?.length || 0) > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{taskToEdit ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          <DialogDescription>
            {taskToEdit ? 'Update the details of the existing task.' : 'Fill in the details for the new task.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="comments">Comments <Badge variant="secondary" className="ml-2">{commentCount}</Badge></TabsTrigger>
                <TabsTrigger value="attachments">Attachments <Badge variant="secondary" className="ml-2">{attachmentCount}</Badge></TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="flex-1 overflow-y-auto pr-2">
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        name="projectId"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Project</FormLabel>
                            <Combobox
                              options={projects}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select project"
                              searchPlaceholder="Search projects..."
                              noResultsText="No projects found."
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    <FormField name="releaseId" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Release</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={!selectedProjectId}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a release" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {releases.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField name="name" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="description" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField name="assignedTo" control={form.control} render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Assigned To</FormLabel>
                          <Combobox
                              options={teamMembers}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select a team member"
                              searchPlaceholder="Search team members..."
                              noResultsText="No team member found."
                          />
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="phase" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phase</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a phase" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {PHASES.map(phase => <SelectItem key={phase} value={phase}>{phase}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField name="priority" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="status" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField name="startDate" control={form.control} render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover><PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent></Popover>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="endDate" control={form.control} render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover><PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent></Popover>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField name="estimatedHours" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Hours</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="percentComplete" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Percent Complete ({field.value}%)</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={100}
                              step={5}
                              defaultValue={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              disabled={hasSubtasks}
                            />
                          </FormControl>
                        </FormItem>
                      )} />
                  </div>
                  <FormField name="dependencies" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dependencies</FormLabel>
                      <FormControl><Input {...field} placeholder="Enter any task dependencies" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="notes" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl><Textarea {...field} placeholder="Add any relevant notes" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Separator />
                  
                  <div>
                      <FormLabel>Sub-tasks</FormLabel>
                      <div className="space-y-2 mt-2">
                          {subTaskFields.map((field, index) => (
                          <div key={field.id} className="flex items-center gap-2">
                              <FormField
                              control={form.control}
                              name={`subTasks.${index}.name`}
                              render={({ field }) => (
                                  <FormItem className="flex-grow">
                                  <FormControl>
                                      <Input {...field} placeholder="Sub-task name" />
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                              />
                               <FormField
                                  control={form.control}
                                  name={`subTasks.${index}.completed`}
                                  render={({ field }) => (
                                      <FormItem>
                                      <FormControl>
                                          <Input type="hidden" {...field} />
                                      </FormControl>
                                      </FormItem>
                                  )}
                              />
                              <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSubTask(index)}
                              >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                          </div>
                          ))}
                          <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendSubTask({ id: `new-${new Date().toISOString()}`, name: '', completed: false })}
                          >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Sub-task
                          </Button>
                      </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="comments" className="flex-1 flex flex-col min-h-0 pt-4">
                  <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-4">
                        {commentFields.length > 0 ? (
                           commentFields.map(comment => (
                               <div key={comment.id} className="flex items-start gap-3">
                                   <UserAvatar name={comment.author} className="mt-1"/>
                                   <div className="flex-1">
                                       <div className="flex items-center justify-between">
                                           <p className="font-semibold text-sm">{comment.author}</p>
                                           <p className="text-xs text-muted-foreground">
                                               {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                           </p>
                                       </div>
                                       <div className="text-sm p-2 bg-muted rounded-md mt-1">
                                          {comment.text}
                                       </div>
                                   </div>
                               </div>
                           ))
                        ) : (
                           <div className="text-center text-sm text-muted-foreground py-8">
                               No comments yet.
                           </div>
                        )}
                    </div>
                  </ScrollArea>
                  <div className="mt-auto pt-4 flex gap-2">
                        <Input 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment();
                              }
                            }}
                        />
                        <Button type="button" onClick={handleAddComment} disabled={!newComment.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                  </div>
              </TabsContent>
              <TabsContent value="attachments" className="flex-1 flex flex-col min-h-0 pt-4">
                  <div className="flex-1 space-y-4">
                      <div className="relative border-2 border-dashed rounded-lg p-8 text-center">
                          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="mt-4 font-semibold text-foreground">Click to upload or drag and drop</p>
                          <p className="text-sm text-muted-foreground">PDF, images, documents (up to 10MB)</p>
                          <Input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} multiple />
                      </div>

                      {attachmentFields.length > 0 && (
                          <ScrollArea className="h-48 pr-4 -mr-4">
                            <div className="space-y-2">
                              {attachmentFields.map((attachment, index) => (
                                <div key={attachment.id} className="flex items-center gap-3 p-2 border rounded-md bg-muted/50">
                                  {getFileIcon(attachment.type)}
                                  <div className="flex-1 truncate">
                                    <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline truncate">
                                      {attachment.name}
                                    </a>
                                  </div>
                                  <Button type="button" variant="ghost" size="icon" onClick={() => removeAttachment(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                      )}
                  </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="border-t pt-4 mt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save Task</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
