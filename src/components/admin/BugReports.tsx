import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { db } from '../../database';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Bug,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  X as XIcon,
  XCircle,
  Image as ImageIcon,
  ZoomIn,
  Monitor,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { motion } from 'motion/react';
import { toast } from 'sonner';

type BugReport = {
  id: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'dismissed';
  priority: 'low' | 'normal' | 'high' | 'critical';
  category?: string;
  screenshotCount?: number;
  screenshots: string[];
  username: string;
  userId: string;
  description: string;
  created_at: string;
  platform: {
    screenSize?: string;
    viewport?: string;
    language?: string;
    userAgent?: string;
  };
};

type ImageModalState = {
  open: boolean;
  reportId: string | null;
  imageIndex: number;
  imageUrl: string;
};

export function BugReports() {
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [isPending, startTransition] = useTransition();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; reportId: string | null }>({
    open: false,
    reportId: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [imageModal, setImageModal] = useState<ImageModalState | null>(null);


  // Load bug reports from database
  useEffect(() => {
    const loadBugReports = async () => {
      setIsLoading(true);
      try {
        const dbReports = await db.getAllBugReports();
        const mappedReports: BugReport[] = dbReports.map((report: any) => ({
          ...report,
          userId: report.userId || report.user_id || '',
        }));
        const sortedReports = mappedReports.sort(
          (a: BugReport, b: BugReport) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        startTransition(() => {
          setBugReports(sortedReports);
        });
      } catch (error) {
        console.error('Error loading bug reports:', error);
        toast.error('Failed to load bug reports');
      } finally {
        setIsLoading(false);
      }
    };

    loadBugReports();
  }, []);

  const handleStatusChange = async (reportId: string, status: BugReport['status']) => {
    try {
      await db.updateBugReport(reportId, { status });
      startTransition(() => {
        setBugReports(prev =>
          prev.map(r => (r.id === reportId ? { ...r, status } : r)),
        );
      });
      const statusText =
        status === 'in_progress'
          ? 'marked as in progress'
          : status === 'resolved'
          ? 'resolved'
          : 'dismissed';
      toast.success(`Bug report ${statusText}`);
    } catch (error) {
      console.error('Error updating bug report status:', error);
      toast.error('Failed to update status');
    }
  };

  const handlePriorityChange = async (reportId: string, priority: BugReport['priority']) => {
    try {
      await db.updateBugReport(reportId, { priority });
      setBugReports(prev =>
        prev.map(r => (r.id === reportId ? { ...r, priority } : r)),
      );
      toast.success(`Priority updated to ${priority}`);
    } catch (error) {
      console.error('Error updating bug report priority:', error);
      toast.error('Failed to update priority');
    }
  };

  const handleDelete = async () => {
    if (deleteDialog.reportId) {
      try {
        await db.deleteBugReport(deleteDialog.reportId);
        setBugReports(prev =>
          prev.filter(report => report.id !== deleteDialog.reportId),
        );
        toast.success('Bug report deleted');
        setDeleteDialog({ open: false, reportId: null });
      } catch (error) {
        console.error('Error deleting bug report:', error);
        toast.error('Failed to delete bug report');
      }
    }
  };

  const getStatusIcon = (status: BugReport['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <AlertTriangle className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      case 'dismissed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: BugReport['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'in_progress':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'resolved':
        return 'bg-green-500 hover:bg-green-600';
      case 'dismissed':
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getPriorityColor = (priority: BugReport['priority']) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'normal':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const toggleExpanded = (reportId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  };

  const openImageModal = (imageUrl: string, reportId: string, imageIndex: number) => {
    setImageModal({
      open: true,
      reportId,
      imageIndex,
      imageUrl,
    });
  };

  const closeImageModal = () => {
    setImageModal(null);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!imageModal || !imageModal.reportId) return;
    const report = bugReports.find(r => r.id === imageModal.reportId);
    if (!report || !report.screenshots || report.screenshots.length === 0) return;

    const total = report.screenshots.length;
    let nextIndex = imageModal.imageIndex;

    if (direction === 'prev') {
      nextIndex = (imageModal.imageIndex - 1 + total) % total;
    } else {
      nextIndex = (imageModal.imageIndex + 1) % total;
    }

    setImageModal({
      open: true,
      reportId: imageModal.reportId,
      imageIndex: nextIndex,
      imageUrl: report.screenshots[nextIndex],
    });
  };

  const pendingReports = bugReports.filter(r => r.status === 'pending');
  const inProgressReports = bugReports.filter(r => r.status === 'in_progress');
  const resolvedReports = bugReports.filter(r => r.status === 'resolved');
  const dismissedReports = bugReports.filter(r => r.status === 'dismissed');

  const BugReportList = ({ reports }: { reports: BugReport[] }) => (
    <div className="space-y-3 md:space-y-4">
      {reports.length === 0 ? (
        <div className="text-center py-12">
          <Bug className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No bug reports in this category</p>
        </div>
      ) : (
        <>
          {reports.map(report => {
            const isExpanded = expandedIds.has(report.id);
            const screenshotCount =
              typeof report.screenshotCount === 'number'
                ? report.screenshotCount
                : report.screenshots?.length || 0;

            return (
              <div key={report.id}>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-pink-500 to-rose-500" />

                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-start gap-3 md:gap-4 mb-4">
                      <Avatar className="w-12 h-12 border-2 border-white shadow-md flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                          <Bug className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge
                            className={`${getStatusColor(
                              report.status,
                            )} text-white border-0 flex items-center`}
                          >
                            {getStatusIcon(report.status)}
                            <span className="ml-1.5 capitalize">
                              {report.status.replace('_', ' ')}
                            </span>
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`capitalize ${getPriorityColor(report.priority)}`}
                          >
                            {report.priority} Priority
                          </Badge>
                          {report.category && (
                            <Badge
                              variant="outline"
                              className="border-pink-300 bg-pink-50 text-pink-700"
                            >
                              {report.category}
                            </Badge>
                          )}
                          {screenshotCount > 0 && (
                            <Badge
                              variant="outline"
                              className="border-purple-300 bg-purple-50 text-purple-700 flex items-center"
                            >
                              <ImageIcon className="w-3 h-3 mr-1" />
                              {screenshotCount} screenshot
                              {screenshotCount > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>

                        <div className="mb-3 p-3 bg-pink-50 rounded-lg border border-pink-100">
                          <p className="text-xs text-pink-600 mb-1">Reported by:</p>
                          <p className="font-medium text-gray-900">{report.username}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            User ID: {report.userId}
                          </p>
                        </div>

                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Bug Description:</p>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-200">
                            {report.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {new Date(report.created_at).toLocaleString('en-US', {
                              month: 'numeric',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(report.id)}
                        className="flex-shrink-0 hover:bg-pink-50"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-pink-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-pink-600" />
                        )}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="pt-4 border-t border-gray-200 space-y-4">
                        {report.screenshots && report.screenshots.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-1 h-5 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full" />
                              <h5 className="font-medium text-gray-900 flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-pink-600" />
                                Screenshots ({report.screenshots.length})
                              </h5>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {report.screenshots.map((screenshot, idx) => (
                                <div
                                  key={idx}
                                  className="relative group rounded-xl overflow-hidden border-2 border-gray-200 hover:border-pink-400 transition-all cursor-pointer shadow-md hover:shadow-xl"
                                  onClick={() =>
                                    openImageModal(screenshot, report.id, idx)
                                  }
                                >
                                  <div className="aspect-video relative bg-gray-100">
                                    <img
                                      src={screenshot}
                                      alt={`Screenshot ${idx + 1}`}
                                      className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="bg-white rounded-full p-3 shadow-lg">
                                        <ZoomIn className="w-6 h-6 text-pink-600" />
                                      </div>
                                    </div>
                                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                      Click to view full size
                                    </div>
                                  </div>
                                  <div className="absolute top-2 right-2 bg-pink-600 text-white text-xs px-2 py-1 rounded-md font-medium">
                                    #{idx + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {report.platform && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
                              <h5 className="font-medium text-gray-900 flex items-center gap-2">
                                <Monitor className="w-5 h-5 text-blue-600" />
                                Platform Details
                              </h5>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="bg-white p-3 rounded-md">
                                  <p className="text-xs text-blue-600 mb-1">Screen:</p>
                                  <p className="font-medium text-gray-900">
                                    {report.platform.screenSize || 'Unknown'}
                                  </p>
                                </div>
                                <div className="bg-white p-3 rounded-md">
                                  <p className="text-xs text-blue-600 mb-1">Viewport:</p>
                                  <p className="font-medium text-gray-900">
                                    {report.platform.viewport || 'Unknown'}
                                  </p>
                                </div>
                                <div className="bg-white p-3 rounded-md">
                                  <p className="text-xs text-blue-600 mb-1">Language:</p>
                                  <p className="font-medium text-gray-900">
                                    {report.platform.language || 'Unknown'}
                                  </p>
                                </div>
                                <div className="bg-white p-3 rounded-md md:col-span-1">
                                  <p className="text-xs text-blue-600 mb-1">
                                    User Agent:
                                  </p>
                                  <p className="font-medium text-gray-900 text-xs break-all">
                                    {report.platform.userAgent || 'Unknown'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {(report.status === 'pending' ||
                          report.status === 'in_progress') && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <label className="text-sm font-medium text-gray-700">
                              Adjust Priority:
                            </label>
                            <Select
                              value={report.priority}
                              onValueChange={(value: string) =>
                                handlePriorityChange(
                                  report.id,
                                  value as BugReport['priority'],
                                )
                              }
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 mt-4">
                      {report.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleStatusChange(report.id, 'in_progress')
                            }
                            className="flex-1 sm:flex-none rounded-lg border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-400"
                          >
                            <AlertTriangle className="w-4 h-4 mr-1.5" />
                            Start Working
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleStatusChange(report.id, 'resolved')
                            }
                            className="flex-1 sm:flex-none rounded-lg border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-400"
                          >
                            <CheckCircle className="w-4 h-4 mr-1.5" />
                            Mark Resolved
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleStatusChange(report.id, 'dismissed')
                            }
                            className="flex-1 sm:flex-none rounded-lg border-gray-300 text-gray-600 hover:bg-gray-50"
                          >
                            <XCircle className="w-4 h-4 mr-1.5" />
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setDeleteDialog({ open: true, reportId: report.id })
                            }
                            className="flex-1 sm:flex-none rounded-lg border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Delete
                          </Button>
                        </>
                      )}
                      {report.status === 'in_progress' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleStatusChange(report.id, 'resolved')
                            }
                            className="flex-1 sm:flex-none rounded-lg border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-400"
                          >
                            <CheckCircle className="w-4 h-4 mr-1.5" />
                            Mark Resolved
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleStatusChange(report.id, 'pending')
                            }
                            className="flex-1 sm:flex-none rounded-lg border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                          >
                            <Clock className="w-4 h-4 mr-1.5" />
                            Back to Pending
                          </Button>
                        </>
                      )}
                      {(report.status === 'resolved' ||
                        report.status === 'dismissed') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setDeleteDialog({ open: true, reportId: report.id })
                          }
                          className="flex-1 sm:flex-none rounded-lg border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
                        >
                          <Trash2 className="w-4 h-4 mr-1.5" />
                          Delete Report
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </>
      )}
    </div>
  );

  const BugReportSkeleton = ({ count = 3 }: { count?: number }) => (
    <div className="space-y-3 md:space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="animate-pulse"
        >
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-gray-200 to-gray-300" />
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl animate-pulse" />
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <div className="h-6 w-20 bg-gray-200 rounded-full" />
                    <div className="h-6 w-24 bg-gray-200 rounded-full" />
                    <div className="h-6 w-20 bg-gray-200 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-20 bg-gray-100 rounded-lg" />
                  </div>
                  <div className="flex items-center gap-2 h-4">
                    <div className="w-3.5 h-3.5 bg-gray-200 rounded-full" />
                    <div className="h-3 bg-gray-200 rounded w-32" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <div className="h-9 w-24 bg-gray-200 rounded-lg flex-1 sm:flex-none" />
                <div className="h-9 w-28 bg-gray-200 rounded-lg flex-1 sm:flex-none" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  const StatsSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
          <div className="h-8 bg-gray-200 rounded w-12" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-pink-500" />
            Bug Reports
          </CardTitle>
          <CardDescription>
            Review and manage bug reports submitted by users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <StatsSkeleton />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <p className="text-xs text-yellow-600 mb-1">Pending</p>
                <p className="text-2xl text-yellow-700">{pendingReports.length}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-blue-600 mb-1">In Progress</p>
                <p className="text-2xl text-blue-700">{inProgressReports.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-xs text-green-600 mb-1">Resolved</p>
                <p className="text-2xl text-green-700">{resolvedReports.length}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Dismissed</p>
                <p className="text-2xl text-gray-700">{dismissedReports.length}</p>
              </div>
            </div>
          )}

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="w-full h-auto grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-0 p-1 bg-muted">
              <TabsTrigger
                value="pending"
                className="text-xs md:text-sm px-2 md:px-3 whitespace-nowrap"
              >
                <span className="hidden sm:inline">Pending </span>
                <span className="sm:hidden">Pending </span>({pendingReports.length})
              </TabsTrigger>
              <TabsTrigger
                value="in_progress"
                className="text-xs md:text-sm px-2 md:px-3 whitespace-nowrap"
              >
                <span className="hidden sm:inline">In Progress </span>
                <span className="sm:hidden">Active </span>({inProgressReports.length})
              </TabsTrigger>
              <TabsTrigger
                value="resolved"
                className="text-xs md:text-sm px-2 md:px-3 whitespace-nowrap"
              >
                <span className="hidden sm:inline">Resolved </span>
                <span className="sm:hidden">Done </span>({resolvedReports.length})
              </TabsTrigger>
              <TabsTrigger
                value="dismissed"
                className="text-xs md:text-sm px-2 md:px-3 whitespace-nowrap"
              >
                <span className="hidden sm:inline">Dismissed </span>
                <span className="sm:hidden">Closed </span>({dismissedReports.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              {isLoading || isPending ? (
                <BugReportSkeleton />
              ) : (
                <BugReportList reports={pendingReports} />
              )}
            </TabsContent>

            <TabsContent value="in_progress" className="mt-6">
              {isLoading || isPending ? (
                <BugReportSkeleton />
              ) : (
                <BugReportList reports={inProgressReports} />
              )}
            </TabsContent>

            <TabsContent value="resolved" className="mt-6">
              {isLoading || isPending ? (
                <BugReportSkeleton />
              ) : (
                <BugReportList reports={resolvedReports} />
              )}
            </TabsContent>

            <TabsContent value="dismissed" className="mt-6">
              {isLoading || isPending ? (
                <BugReportSkeleton />
              ) : (
                <BugReportList reports={dismissedReports} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {imageModal && (
        <Dialog open={imageModal.open} onOpenChange={closeImageModal}>
          <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 bg-black/95">
            <DialogTitle className="sr-only">Bug Report Screenshot</DialogTitle>
            <DialogDescription className="sr-only">
              Viewing screenshot {imageModal.imageIndex + 1} of{' '}
              {bugReports.find(r => r.id === imageModal.reportId)?.screenshots.length ||
                0}{' '}
              from bug report
            </DialogDescription>

            <div className="relative w-full h-full flex items-center justify-center">
              <Button
                onClick={closeImageModal}
                className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10 p-0"
                size="icon"
              >
                <XIcon className="w-5 h-5" />
              </Button>

              <div className="absolute top-4 left-4 z-50 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                {imageModal.imageIndex + 1} /{' '}
                {bugReports.find(r => r.id === imageModal.reportId)?.screenshots.length ||
                  0}
              </div>

              {bugReports.find(r => r.id === imageModal.reportId)?.screenshots
                .length! > 1 && (
                <>
                  <Button
                    onClick={() => navigateImage('prev')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 p-0"
                    size="icon"
                  >
                    <ChevronUp className="w-6 h-6 rotate-[-90deg]" />
                  </Button>
                  <Button
                    onClick={() => navigateImage('next')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 p-0"
                    size="icon"
                  >
                    <ChevronUp className="w-6 h-6 rotate-90" />
                  </Button>
                </>
              )}

              <div className="w-full h-full flex items-center justify-center p-8">
                <img
                  src={imageModal.imageUrl}
                  alt="Bug report screenshot"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open: boolean) =>
          setDeleteDialog({ open, reportId: open ? deleteDialog.reportId : null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bug Report?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bug report? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
