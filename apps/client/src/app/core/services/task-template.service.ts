import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTaskTemplateDto, ITaskTemplate, baseURL } from '@quickprolaw/shared-interfaces';

@Injectable({
  providedIn: 'root'
})
export class TaskTemplateService {
  private http = inject(HttpClient);
  private templatesUrl = `${baseURL}task-templates/`;

  getTemplates(): Observable<ITaskTemplate[]> {
    return this.http.get<ITaskTemplate[]>(this.templatesUrl);
  }

  createTemplate(templateData: CreateTaskTemplateDto): Observable<ITaskTemplate> {
    return this.http.post<ITaskTemplate>(this.templatesUrl, templateData);
  }

  getTemplateById(templateId: string): Observable<ITaskTemplate> {
    return this.http.get<ITaskTemplate>(`${this.templatesUrl}${templateId}`);
  }

  updateTemplate(templateId: string, templateData: CreateTaskTemplateDto): Observable<ITaskTemplate> {
    return this.http.put<ITaskTemplate>(`${this.templatesUrl}${templateId}`, templateData);
  }

  deleteTemplate(templateId: string): Observable<void> {
    return this.http.delete<void>(`${this.templatesUrl}${templateId}`);
  }
}