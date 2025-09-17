import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Phone,
  MessageCircle,
  BookOpen,
  Video,
  Download,
  ExternalLink,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  FileText,
  Users,
  Shield,
  Settings,
  Camera,
  MapPin,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export function HelpSupportPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      category: 'Getting Started',
      items: [
        {
          question: 'How do I create a new case?',
          answer: 'Navigate to the Cases page and click the "New Case" button. Fill in the required information including the missing person\'s details, last known location, and any relevant photos.'
        },
        {
          question: 'What permissions do I need?',
          answer: 'Permissions vary by role. Investigators can create and manage cases, Admin users have full system access, and Case Managers can oversee multiple cases. Contact your system administrator for specific permissions.'
        },
        {
          question: 'How do I set up camera feeds?',
          answer: 'Go to Admin > Camera Sources to add and configure camera feeds. You\'ll need the camera URL, authentication credentials, and location information.'
        }
      ]
    },
    {
      category: 'Detection System',
      items: [
        {
          question: 'How does the AI detection work?',
          answer: 'The system uses advanced facial recognition and object detection AI to analyze camera feeds in real-time. When a match is found with missing persons database, it generates alerts.'
        },
        {
          question: 'What are the detection accuracy rates?',
          answer: 'Our AI models achieve 95%+ accuracy under optimal conditions. Factors like lighting, camera angle, and image quality can affect performance.'
        },
        {
          question: 'How do I improve detection accuracy?',
          answer: 'Ensure cameras are properly positioned, well-lit, and have high resolution. Regularly update the missing persons database with recent photos.'
        }
      ]
    },
    {
      category: 'Alerts & Notifications',
      items: [
        {
          question: 'How do I receive alerts?',
          answer: 'Alerts are sent via email, SMS, and in-app notifications. You can configure your notification preferences in your user settings.'
        },
        {
          question: 'What triggers an alert?',
          answer: 'Alerts are triggered when the AI system detects a potential match with a missing person, when system errors occur, or when critical updates are available.'
        },
        {
          question: 'How do I manage alert priorities?',
          answer: 'Alerts are automatically prioritized based on match confidence and case urgency. You can manually adjust priorities in the Alerts dashboard.'
        }
      ]
    },
    {
      category: 'Troubleshooting',
      items: [
        {
          question: 'Why is my camera feed not working?',
          answer: 'Check your internet connection, verify camera credentials, ensure the camera is online, and confirm the URL format is correct. Contact support if issues persist.'
        },
        {
          question: 'What should I do if the system is slow?',
          answer: 'Clear your browser cache, check your internet connection, and ensure you\'re using a supported browser. Contact admin if the issue affects multiple users.'
        },
        {
          question: 'How do I report a bug?',
          answer: 'Use the "Report Issue" button in the support section or email support@narayana-system.com with detailed steps to reproduce the problem.'
        }
      ]
    }
  ];

  const guides = [
    {
      title: 'Quick Start Guide',
      description: 'Get up and running with the basic features',
      icon: BookOpen,
      category: 'Getting Started',
      estimatedTime: '10 min'
    },
    {
      title: 'Case Management Workflow',
      description: 'Learn the complete case management process',
      icon: FileText,
      category: 'Cases',
      estimatedTime: '15 min'
    },
    {
      title: 'Camera Configuration',
      description: 'Set up and configure camera feeds',
      icon: Camera,
      category: 'Setup',
      estimatedTime: '20 min'
    },
    {
      title: 'Understanding Detection Alerts',
      description: 'How to interpret and respond to alerts',
      icon: AlertCircle,
      category: 'Detection',
      estimatedTime: '12 min'
    },
    {
      title: 'Analytics & Reporting',
      description: 'Generate and analyze system reports',
      icon: BarChart3,
      category: 'Analytics',
      estimatedTime: '18 min'
    },
    {
      title: 'Admin Configuration',
      description: 'System administration and settings',
      icon: Settings,
      category: 'Admin',
      estimatedTime: '25 min'
    }
  ];

  const supportChannels = [
    {
      name: 'Email Support',
      description: 'Get help via email within 24 hours',
      icon: Mail,
      contact: 'support@narayana-system.com',
      responseTime: '24 hours',
      availability: '24/7'
    },
    {
      name: 'Phone Support',
      description: 'Immediate assistance for urgent issues',
      icon: Phone,
      contact: '+1 (555) 123-4567',
      responseTime: 'Immediate',
      availability: 'Mon-Fri 9AM-6PM EST'
    },
    {
      name: 'Live Chat',
      description: 'Real-time chat with support team',
      icon: MessageCircle,
      contact: 'Available in app',
      responseTime: '< 5 min',
      availability: 'Mon-Fri 9AM-6PM EST'
    },
    {
      name: 'Video Call',
      description: 'Screen sharing and video support',
      icon: Video,
      contact: 'Schedule appointment',
      responseTime: 'By appointment',
      availability: 'Mon-Fri 10AM-4PM EST'
    }
  ];

  const systemStatus = [
    {
      component: 'AI Detection Engine',
      status: 'operational',
      description: 'All detection systems running normally',
      lastChecked: '2 minutes ago'
    },
    {
      component: 'Camera Feeds',
      status: 'operational',
      description: '98% of cameras online and functioning',
      lastChecked: '1 minute ago'
    },
    {
      component: 'Database',
      status: 'operational',
      description: 'All databases responsive and healthy',
      lastChecked: '30 seconds ago'
    },
    {
      component: 'API Services',
      status: 'degraded',
      description: 'Minor latency issues affecting some features',
      lastChecked: '5 minutes ago'
    },
    {
      component: 'Alert System',
      status: 'operational',
      description: 'Alert notifications delivering normally',
      lastChecked: '1 minute ago'
    }
  ];

  const filteredFAQs = faqs.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge className="bg-green-100 text-green-800">Operational</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'outage':
        return <Badge className="bg-red-100 text-red-800">Outage</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Layout
      title="Help & Support"
      breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Help & Support' }
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-3xl font-bold">Help & Support Center</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions, access documentation, and get support from our team
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="faq" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="faq">FAQs</TabsTrigger>
              <TabsTrigger value="guides">Guides</TabsTrigger>
              <TabsTrigger value="support">Contact Support</TabsTrigger>
              <TabsTrigger value="status">System Status</TabsTrigger>
            </TabsList>

            {/* FAQs Tab */}
            <TabsContent value="faq" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Frequently Asked Questions
                  </CardTitle>
                  <CardDescription>
                    Find answers to common questions about the Narayana system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredFAQs.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {filteredFAQs.map((category, categoryIndex) => (
                        <div key={categoryIndex} className="mb-6">
                          <h3 className="text-lg font-semibold mb-4">{category.category}</h3>
                          {category.items.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${categoryIndex}-${index}`}>
                              <AccordionTrigger>{faq.question}</AccordionTrigger>
                              <AccordionContent>{faq.answer}</AccordionContent>
                            </AccordionItem>
                          ))}
                        </div>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="text-center py-8">
                      <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search terms or browse all FAQs.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Guides Tab */}
            <TabsContent value="guides" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    User Guides & Documentation
                  </CardTitle>
                  <CardDescription>
                    Comprehensive guides to help you master the Narayana system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {guides.map((guide, index) => (
                      <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <guide.icon className="h-8 w-8 text-primary" />
                            <Badge variant="outline" className="text-xs">
                              {guide.category}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{guide.title}</CardTitle>
                          <CardDescription>{guide.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {guide.estimatedTime}
                            </div>
                            <Button size="sm">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Contact Support
                    </CardTitle>
                    <CardDescription>
                      Get help from our support team through multiple channels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {supportChannels.map((channel, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        <channel.icon className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold">{channel.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{channel.description}</p>
                          <div className="text-sm space-y-1">
                            <div><strong>Contact:</strong> {channel.contact}</div>
                            <div><strong>Response Time:</strong> {channel.responseTime}</div>
                            <div><strong>Availability:</strong> {channel.availability}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Resources & Downloads
                    </CardTitle>
                    <CardDescription>
                      Access documentation, templates, and other resources
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      User Manual (PDF)
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="mr-2 h-4 w-4" />
                      API Documentation
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Video className="mr-2 h-4 w-4" />
                      Video Tutorials
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="mr-2 h-4 w-4" />
                      Security Guidelines
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* System Status Tab */}
            <TabsContent value="status" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    System Status
                  </CardTitle>
                  <CardDescription>
                    Real-time status of all system components and services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {systemStatus.map((component, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`h-3 w-3 rounded-full ${
                            component.status === 'operational' ? 'bg-green-500' :
                            component.status === 'degraded' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`} />
                          <div>
                            <h4 className="font-semibold">{component.component}</h4>
                            <p className="text-sm text-muted-foreground">{component.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(component.status)}
                          <div className="text-xs text-muted-foreground mt-1">
                            Last checked: {component.lastChecked}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-semibold">System Overall: Operational</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      All major systems are functioning normally. Minor performance issues may affect some features.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
}