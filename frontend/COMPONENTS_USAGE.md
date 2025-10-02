# Component Usage Guide

This document provides usage examples for all reusable components in the project.

## UI Components (shadcn/ui style)

### Button

```tsx
import { Button } from '@/components/ui/Button';

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Delete</Button>
<Button variant="success">Save</Button>
<Button variant="ghost">Ghost</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Loading state
<Button isLoading>Saving...</Button>
```

### Dialog/Modal

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description text</DialogDescription>
    </DialogHeader>
    <DialogBody>
      <p>Dialog content goes here</p>
    </DialogBody>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant="primary">Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Table

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map(item => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>{item.email}</TableCell>
        <TableCell>{item.status}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Select

```tsx
import { Select, SelectItem } from '@/components/ui/Select';

<Select value={value} onValueChange={setValue} placeholder="Select an option">
  <SelectItem value="1">Option 1</SelectItem>
  <SelectItem value="2">Option 2</SelectItem>
  <SelectItem value="3">Option 3</SelectItem>
</Select>
```

### Input

```tsx
import { Input } from '@/components/ui/Input';

<Input
  type="text"
  placeholder="Enter text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### Badge

```tsx
import { Badge } from '@/components/ui/Badge';

<Badge variant="success">Active</Badge>
<Badge variant="secondary">Inactive</Badge>
<Badge variant="destructive">Blocked</Badge>
```

### Label

```tsx
import { Label } from '@/components/ui/Label';

<Label htmlFor="email" required>Email</Label>
<Input id="email" type="email" />
```

## Custom Components

### DataTable

Advanced table with search, sort, and pagination.

```tsx
import { DataTable, DataTableColumn } from '@/components/DataTable';

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

const columns: DataTableColumn<User>[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
  },
  {
    key: 'status',
    label: 'Status',
    render: (user) => (
      <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
        {user.status}
      </Badge>
    ),
  },
  {
    key: 'actions',
    label: 'Actions',
    render: (user) => (
      <Button onClick={() => handleEdit(user)}>Edit</Button>
    ),
  },
];

<DataTable
  data={users}
  columns={columns}
  searchKeys={['name', 'email']}
  searchPlaceholder="Search users..."
  pageSize={10}
  emptyMessage="No users found"
/>
```

### FormModal

Modal with form handling.

```tsx
import { FormModal, FormField } from '@/components/FormModal';

const [open, setOpen] = useState(false);
const [name, setName] = useState('');
const [email, setEmail] = useState('');

const handleSubmit = async () => {
  // Save data
  await saveUser({ name, email });
  setOpen(false);
};

<FormModal
  open={open}
  onOpenChange={setOpen}
  title="Add User"
  description="Fill in the user details"
  onSubmit={handleSubmit}
  submitLabel="Save"
  submitDisabled={!name || !email}
>
  <FormField
    label="Name"
    name="name"
    value={name}
    onChange={setName}
    required
  />

  <FormField
    label="Email"
    name="email"
    type="email"
    value={email}
    onChange={setEmail}
    required
  />

  <FormField
    label="Role"
    name="role"
    type="select"
    value={role}
    onChange={setRole}
    options={[
      { value: 'admin', label: 'Administrator' },
      { value: 'user', label: 'User' },
    ]}
  />

  <FormField
    label="Bio"
    name="bio"
    type="textarea"
    value={bio}
    onChange={setBio}
    rows={4}
  />
</FormModal>
```

### DatePicker

Calendar-based date picker.

```tsx
import { DatePicker } from '@/components/DatePicker';

const [selectedDate, setSelectedDate] = useState<Date | undefined>();

<DatePicker
  value={selectedDate}
  onChange={setSelectedDate}
  minDate={new Date()}
  maxDate={new Date(2025, 11, 31)}
  placeholder="Select a date"
/>
```

## TypeScript Types

All components are fully typed. Common types:

```tsx
// Contact type
interface Contact {
  id: string;
  organization_id: string;
  phone: string;
  name?: string;
  email?: string;
  status: 'active' | 'inactive' | 'blocked';
  total_bookings: number;
  created_at: string;
}

// Pet type
interface Pet {
  id: string;
  contact_id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'unknown';
  created_at: string;
}

// Booking type
interface Booking {
  id: string;
  organization_id: string;
  contact_id: string;
  pet_id?: string;
  service_id?: string;
  booking_type: 'appointment' | 'hotel' | 'daycare' | 'grooming' | 'training';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  start_time: string;
  end_time: string;
  price?: number;
  paid: boolean;
  created_at: string;
}
```

## Accessibility Features

All components follow WCAG 2.1 AA guidelines:

- Semantic HTML elements
- ARIA attributes where needed
- Keyboard navigation support
- Focus management
- Color contrast compliance
- Screen reader friendly

## Performance Optimizations

- `useMemo` for expensive computations
- `useCallback` for event handlers
- Virtualization for long lists (consider adding react-window)
- Lazy loading for routes
- Code splitting
- Real-time subscriptions with cleanup

## Responsive Design

All components are mobile-first and responsive:

- Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Grid/Flex layouts
- Touch-friendly tap targets (min 44x44px)
- Horizontal scrolling for tables on mobile
