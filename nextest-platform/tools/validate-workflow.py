#!/usr/bin/env python3
"""
Workflow Validation and Auto-Fix Tool
"""
import json
import sys
import os
import re
import argparse

class WorkflowValidator:
    FIELD_MAPPINGS = {
        'test_id': 'testId', 'group_id': 'groupId', 'tenant_id': 'tenantId',
        'project_id': 'projectId', 'parent_id': 'parentId', 'http_config': 'http',
    }
    
    def __init__(self, filepath):
        self.filepath = filepath
        self.errors, self.warnings, self.fixes = [], [], []
        self.data = {}
        
    def load(self):
        try:
            with open(self.filepath, 'r') as f:
                self.data = json.load(f)
            return True
        except Exception as e:
            self.errors.append(f"Cannot load: {e}")
            return False
    
    def validate(self):
        if not self.data:
            return False
        if 'workflowId' not in self.data:
            self.errors.append("Missing: workflowId")
        if 'definition' not in self.data:
            self.errors.append("Missing: definition")
            return False
        
        steps = self.data.get('definition', {}).get('steps', {})
        for step_id, step in steps.items():
            self._validate_step(step_id, step)
        return len(self.errors) == 0
    
    def _validate_step(self, step_id, step):
        config = step.get('config', {})
        step_type = step.get('type', '')
        
        if step_type == 'http' and 'body' in config:
            for key in config['body'].keys():
                if key in self.FIELD_MAPPINGS:
                    self.warnings.append(f"{step_id}: Use '{self.FIELD_MAPPINGS[key]}' not '{key}'")
        
        if step_type == 'assert':
            for i, a in enumerate(config.get('assertions', [])):
                if '.status}}' in a.get('actual', '') and '.response.statusCode' not in a.get('actual', ''):
                    self.warnings.append(f"{step_id}: Use .response.statusCode not .status")
    
    def fix(self):
        modified = False
        definition = self.data.get('definition', {})
        
        # Fix baseUrl
        if 'baseUrl' in definition.get('variables', {}):
            url = definition['variables']['baseUrl']
            if '/api/v2' in url:
                definition['variables']['baseUrl'] = url.replace('/api/v2', '/api')
                self.fixes.append("Fixed baseUrl")
                modified = True
        
        # Fix steps
        for step_id, step in definition.get('steps', {}).items():
            config = step.get('config', {})
            
            # Fix field names
            if step.get('type') == 'http' and 'body' in config:
                new_body = {}
                for k, v in config['body'].items():
                    new_key = self.FIELD_MAPPINGS.get(k, k)
                    if new_key != k:
                        self.fixes.append(f"{step_id}: {k} -> {new_key}")
                        modified = True
                    new_body[new_key] = v
                config['body'] = new_body
            
            # Fix assertion paths
            if step.get('type') == 'assert':
                for a in config.get('assertions', []):
                    actual = a.get('actual', '')
                    new_actual = re.sub(r'(\{\{[^}]+)\.status(\}\})', r'\1.response.statusCode\2', actual)
                    if new_actual != actual:
                        a['actual'] = new_actual
                        self.fixes.append(f"{step_id}: Fixed status path")
                        modified = True
        
        return modified
    
    def save(self, path=None):
        with open(path or self.filepath, 'w') as f:
            json.dump(self.data, f, indent=2)
    
    def report(self):
        print(f"\n{'='*50}\n{self.filepath}\n{'='*50}")
        if self.errors:
            print(f"\nErrors: {len(self.errors)}")
            for e in self.errors: print(f"  - {e}")
        if self.warnings:
            print(f"\nWarnings: {len(self.warnings)}")
            for w in self.warnings: print(f"  - {w}")
        if self.fixes:
            print(f"\nFixes: {len(self.fixes)}")
            for f in self.fixes: print(f"  - {f}")
        if not self.errors and not self.warnings:
            print("\n✅ Valid!")
        return len(self.errors) == 0

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('file', nargs='?')
    parser.add_argument('--fix', action='store_true')
    parser.add_argument('--batch', metavar='DIR')
    args = parser.parse_args()
    
    if args.batch:
        files = [os.path.join(args.batch, f) for f in os.listdir(args.batch) if f.endswith('.json')]
        for fp in files:
            v = WorkflowValidator(fp)
            if v.load():
                v.validate()
                if args.fix and v.fix():
                    v.save()
                v.report()
    elif args.file:
        v = WorkflowValidator(args.file)
        if v.load():
            v.validate()
            if args.fix and v.fix():
                v.save()
            v.report()

if __name__ == '__main__':
    main()
