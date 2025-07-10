'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ToolConfirmationProps {
  toolDescription: string;
  toolPreview?: {
    action?: string;
    title?: string;
    summary?: string[];
    details?: string[];
    data?: string;
    tableHeaders?: string[];
    tableData?: Record<string, unknown>[];
    stats?: Record<string, unknown>;
  };
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting?: boolean;
}

export function ToolConfirmation({
  toolDescription,
  toolPreview,
  onConfirm,
  onCancel,
  isExecuting = false
}: ToolConfirmationProps) {
  // Compact mode for simple tool calls (like GitHub Copilot)
  const isCompactMode = !toolPreview?.tableData && !toolPreview?.tableHeaders;
  
  if (isCompactMode) {
    return (
      <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-yellow-800">
              {toolPreview?.action || toolDescription}
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={onConfirm}
              disabled={isExecuting}
              size="sm"
              className="h-7 px-3 bg-green-500 hover:bg-green-600 text-white text-xs"
            >
              {isExecuting ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  OK
                </>
              )}
            </Button>
            
            <Button
              onClick={onCancel}
              disabled={isExecuting}
              size="sm"
              variant="outline"
              className="h-7 px-3 border-red-300 text-red-600 hover:bg-red-50 text-xs"
            >
              <XCircle className="w-3 h-3 mr-1" />
              Hủy
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Full mode for detailed previews (like Create_Content_Schedule)
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg text-yellow-800">
              Xác nhận thực hiện
            </CardTitle>
            <p className="text-sm text-yellow-700 mt-1">
              AI muốn thực hiện: {toolPreview?.action || toolDescription}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {toolPreview && (
          <div className="mb-4">
            {toolPreview.title && (
              <div className="font-semibold text-gray-900 mb-2">
                {toolPreview.title}
              </div>
            )}
            
            {toolPreview.summary && (
              <div className="space-y-1 mb-3">
                {toolPreview.summary.map((item, idx) => (
                  <div key={idx} className="text-sm text-gray-700">
                    {item}
                  </div>
                ))}
              </div>
            )}
            
            {toolPreview.details && (
              <div className="space-y-1 mb-3">
                {toolPreview.details.map((detail, idx) => (
                  <div key={idx} className="text-sm text-gray-700">
                    {detail}
                  </div>
                ))}
              </div>
            )}
            
            {/* Scrollable table for detailed content like Create_Content_Schedule */}
            {toolPreview.tableHeaders && toolPreview.tableData && (
              <div className="mb-4">
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {toolPreview.tableHeaders.map((header, idx) => (
                          <th key={idx} className="px-2 py-2 text-left font-medium text-gray-700 border-b">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {toolPreview.tableData.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-gray-50">
                          {typeof row === 'object' ? (
                            Object.values(row).map((cell, cellIdx) => (
                              <td key={cellIdx} className="px-2 py-2 text-gray-600 border-b">
                                {String(cell)}
                              </td>
                            ))
                          ) : (
                            <td className="px-2 py-2 text-gray-600 border-b" colSpan={toolPreview.tableHeaders?.length || 1}>
                              {String(row)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {toolPreview.stats && (
                  <div className="text-xs text-gray-500 mt-2">
                    {Object.entries(toolPreview.stats).map(([key, value]) => (
                      <span key={key} className="mr-4">
                        {key}: {JSON.stringify(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {toolPreview.data && (
              <div className="bg-gray-100 p-3 rounded text-sm text-gray-700 mb-3">
                {toolPreview.data}
              </div>
            )}
          </div>
        )}
        
        <div className="flex gap-3">
          <Button
            onClick={onConfirm}
            disabled={isExecuting}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
          >
            {isExecuting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Đang thực hiện...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Xác nhận
              </>
            )}
          </Button>
          
          <Button
            onClick={onCancel}
            disabled={isExecuting}
            variant="outline"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Hủy bỏ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
