import Link from 'next/link';
import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

async function getPosts() {
  const { data: posts, error } = await supabaseAdmin
    .from('posts')
    .select(`
      id,
      title,
      slug,
      status,
      created_at,
      author_id,
      users(name)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to fetch posts:', error);
    return [];
  }

  return posts || [];
}

export default async function PostsPage() {
  await requirePermissionPage(PERMISSIONS.POSTS_READ);
  const posts = await getPosts();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Posts</h1>
          <p className="mt-2 text-gray-600">
            Manage your blog posts and articles
          </p>
        </div>
        <Button>
          <Link href="/dashboard/posts/new">Create Post</Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No posts yet</CardTitle>
            <CardDescription>
              Get started by creating your first post
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>
              <Link href="/dashboard/posts/new">Create Your First Post</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {posts.map((post: any) => (
              <li key={post.id}>
                <Link
                  href={`/dashboard/posts/${post.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-lg font-medium text-primary truncate">
                          {post.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          /{post.slug}
                        </p>
                      </div>
                      <div className="ml-2 flex flex-col items-end space-y-1">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            post.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : post.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {post.status}
                        </span>
                        <p className="text-xs text-gray-500">
                          by {post.users?.name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Created {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}