"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw,
  BookOpen,
  Activity
} from 'lucide-react';
import { testDatabaseConnection, getNelsonChapters } from '@/lib/supabase';
import { validateEmbeddingModel } from '@/services/embeddingService';

interface DatabaseStatus {
  connected: boolean;
  nelsonChunksCount: number;
  sampleChapter?: string;
  chapters?: string[];
  embeddingModelAvailable?: boolean;
  lastChecked?: Date;
}

export function DatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Test database connection
      const dbStatus = await testDatabaseConnection();
      
      // Test embedding model
      const embeddingAvailable = await validateEmbeddingModel();
      
      // Get sample chapters
      let chapters: string[] = [];
      try {
        chapters = await getNelsonChapters();
      } catch (chaptersError) {
        console.warn('Could not fetch chapters:', chaptersError);
      }
      
      setStatus({
        ...dbStatus,
        chapters: chapters.slice(0, 5), // Show first 5 chapters
        embeddingModelAvailable: embeddingAvailable,
        lastChecked: new Date()
      });
      
    } catch (err) {
      console.error('Database status check failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus({
        connected: false,
        nelsonChunksCount: 0,
        embeddingModelAvailable: false,
        lastChecked: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const getStatusColor = (connected: boolean) => {
    return connected ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (connected: boolean) => {
    return connected ? CheckCircle : XCircle;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Nelson-GPT Database Status
        </CardTitle>
        <CardDescription>
          Connection status and content availability
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <Button 
            onClick={testConnection} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>
          
          {status?.lastChecked && (
            <span className="text-xs text-muted-foreground">
              Last checked: {status.lastChecked.toLocaleTimeString()}
            </span>
          )}
        </div>

        {status && (
          <div className="space-y-3">
            {/* Database Connection */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {React.createElement(getStatusIcon(status.connected), {
                  className: `h-5 w-5 ${getStatusColor(status.connected)}`
                })}
                <div>
                  <p className="font-medium">Database Connection</p>
                  <p className="text-sm text-muted-foreground">
                    Supabase connection status
                  </p>
                </div>
              </div>
              <Badge variant={status.connected ? "default" : "destructive"}>
                {status.connected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>

            {/* Nelson Textbook Content */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <BookOpen className={`h-5 w-5 ${status.nelsonChunksCount > 0 ? 'text-green-600' : 'text-red-600'}`} />
                <div>
                  <p className="font-medium">Nelson Textbook Content</p>
                  <p className="text-sm text-muted-foreground">
                    Available text chunks for search
                  </p>
                </div>
              </div>
              <Badge variant={status.nelsonChunksCount > 0 ? "default" : "secondary"}>
                {status.nelsonChunksCount.toLocaleString()} chunks
              </Badge>
            </div>

            {/* Embedding Model */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {React.createElement(getStatusIcon(status.embeddingModelAvailable || false), {
                  className: `h-5 w-5 ${getStatusColor(status.embeddingModelAvailable || false)}`
                })}
                <div>
                  <p className="font-medium">AI Embedding Model</p>
                  <p className="text-sm text-muted-foreground">
                    Hugging Face embedding service
                  </p>
                </div>
              </div>
              <Badge variant={status.embeddingModelAvailable ? "default" : "destructive"}>
                {status.embeddingModelAvailable ? 'Available' : 'Unavailable'}
              </Badge>
            </div>

            {/* Sample Chapter */}
            {status.sampleChapter && (
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <p className="font-medium">Sample Content</p>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Example chapter: <strong>{status.sampleChapter}</strong>
                </p>
                
                {status.chapters && status.chapters.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Available chapters (showing first 5):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {status.chapters.map((chapter, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {chapter}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {status?.connected && status.nelsonChunksCount > 0 && status.embeddingModelAvailable && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ✅ Nelson-GPT is fully operational! The database contains {status.nelsonChunksCount.toLocaleString()} 
              text chunks from the Nelson Textbook of Pediatrics, and the AI embedding model is ready for semantic search.
            </AlertDescription>
          </Alert>
        )}

        {(!status?.connected || status.nelsonChunksCount === 0 || !status.embeddingModelAvailable) && !isLoading && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              ⚠️ Nelson-GPT requires all systems to be operational. Please check your API keys and database connection.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}