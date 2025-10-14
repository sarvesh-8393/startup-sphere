'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { LinkIcon, Briefcase, ChevronDown, Wallet, Target, Trophy, Users, Lightbulb } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

function SearchParamsWrapper({ children }: { children: (edit: string | null) => React.ReactNode }) {
  const searchParams = useSearchParams();
  const edit = searchParams.get('edit');
  return <>{children(edit)}</>;
}

const INDUSTRY_TAGS = [
  'ai', 'saas', 'fintech', 'healthtech', 'e-commerce',
  'web3', 'edtech', 'marketing', 'analytics', 'productivity',
  'developer tools', 'sustainability'
];

type FormDataType = {
  id?: string;
  name: string;
  slug: string; // Added slug to the type
  short_description: string;
  description: string;
  website_url: string;
  tags: string[];
  funding_stage: string;
  account_details: string;
  image_file: File | null;
  image_url: string;
  founder_id:string;
  mission_statement: string;
  problem_solution: string;
  founder_story: string;
  target_market: string;
  traction: string;
  use_of_funds: string;
  milestones: string;
  team_profiles: string;
  awards: string;
  location: string;  // Added location field
  update_message: string; // Added for custom update message
  follower_message: string; // Added for message to followers
};

function AddStartupPageContent({ edit }: { edit: string | null }) {
  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    slug: '', // Initialize slug
    short_description: '',
    description: '',
    website_url: '',
    tags: [],
    funding_stage: 'Pre-seed',
    account_details: '',
    image_file: null,
    image_url: '',
      founder_id:"",
    mission_statement: '',
    problem_solution: '',
    founder_story: '',
    target_market: '',
    traction: '',
    use_of_funds: '',
    milestones: '',
    team_profiles: '',
    awards: '',
    location: '',  // Initialize location
    update_message: '', // Initialize update message
    follower_message: '', // Initialize follower message
  });

  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const tagsDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Auto-resize function
  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  // Load existing startup data for editing
  const loadStartupData = useCallback(async (identifier: string) => {
    setIsLoading(true);
    try {
      // Try by slug first, then by ID if that fails
      const response = await fetch(`/api/startup/${identifier}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch startup: ${response.status} ${response.statusText}`);
      }
      const startupData = await response.json();

      // Convert tags string to array if needed
      const tags = Array.isArray(startupData.tags)
        ? startupData.tags
        : startupData.tags ? startupData.tags.split(',') : [];

      setFormData({
        id: startupData.id,
        name: startupData.name || '',
        slug: startupData.slug || '', // Load existing slug
        short_description: startupData.short_description || '',
        description: startupData.description || '',
        website_url: startupData.website_url || '',
        tags: tags,
        funding_stage: startupData.funding_stage || 'Pre-seed',
        account_details: startupData.account_details || '',
        image_file: null,
        image_url: startupData.image_url || '',
          founder_id:startupData.founder_id||'',
        mission_statement: startupData.mission_statement || '',
        problem_solution: startupData.problem_solution || '',
        founder_story: startupData.founder_story || '',
        target_market: startupData.target_market || '',
        traction: startupData.traction || '',
        use_of_funds: startupData.use_of_funds || '',
        milestones: startupData.milestones || '',
        team_profiles: startupData.team_profiles || '',
        awards: startupData.awards || '',
        location: startupData.location || '',  // Added location
        update_message: '', // Initialize update message for editing
        follower_message: '', // Initialize follower message for editing
      });

      // Set logo preview if image_url exists
      if (startupData.image_url) {
        setLogoPreview(startupData.image_url);
      }

      toast.success('Startup data loaded for editing');
    } catch (error) {
      console.error('Error loading startup data:', error);
      toast.error('Error loading startup data');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Check if we're in edit mode and load existing data
  useEffect(() => {
    if (edit) {
      setIsEditing(true);
      loadStartupData(edit);
    }
  }, [edit, loadStartupData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      return updated;
    });

    // Auto-resize textarea to fit content
    if (e.target.tagName === 'TEXTAREA') {
      const textarea = e.target as HTMLTextAreaElement;
      autoResize(textarea);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image_file: file }));
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleTagSelect = (tag: string) => {
    setFormData(prev => {
      const tags = prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags };
    });
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);


    const submissionData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && key !== 'id') {
        if (key === 'image_file') {
          submissionData.append(key, value as File);
        } else if (Array.isArray(value)) {
          submissionData.append(key, value.join(','));
        } else {
          submissionData.append(key, value.toString());
        }
      }
    });



   try {
    const endpoint = isEditing ? '/api/update' : '/api/create';
    const res = await fetch(endpoint, {
      method: isEditing ? 'PUT' : 'POST', // Use PUT for updates
      body: submissionData,
    });


      if (res.ok) {
        toast.success(isEditing ? 'Startup updated successfully!' : 'Startup added successfully!');
        if(isEditing){
          router.push(`/startup/${formData.slug}`);
        }

      } else {
        const errorData = await res.json();
        toast.error(errorData.message || `Failed to ${isEditing ? 'update' : 'add'} startup`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEditing) {
      router.push('/');
    } else {
      // Reset form for new creation
      setFormData({
        name: '',
        slug: '', // Reset slug
        short_description: '',
        description: '',
        website_url: '',
        tags: [],
        funding_stage: 'Pre-seed',
        account_details: '',
        image_file: null,
        image_url: '',
        founder_id:'',
        mission_statement: '',
        problem_solution: '',
        founder_story: '',
        target_market: '',
        traction: '',
        use_of_funds: '',
        milestones: '',
        team_profiles: '',
        awards: '',
        location: '',  // Reset location
        update_message: '', // Reset update message
        follower_message: '', // Reset follower message
      });
      setLogoPreview('');
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-pink-50 to-amber-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto'></div>
          <p className='mt-4 text-pink-900'>Loading startup data...</p>
        </div>
      </div>
    );
  }



  return (
    <div className='min-h-screen'>
      <main className='pt-32 pb-10 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-lg border border-pink-100'>

          <div className='mb-10 text-center'>
            <h1 className='text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 to-amber-600 bg-clip-text text-transparent'>
              {isEditing ? 'Edit Your Startup' : 'Showcase Your Startup'}
            </h1>
            <p className='mt-3 text-lg text-gray-600'>
              {isEditing
                ? 'Update your startup information and story'
                : 'Tell your complete story and build emotional connection with your audience.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-8'>

            {/* Section 1: Basic Info */}
            <div className='p-6 border-l-4 border-pink-400 bg-gradient-to-r from-pink-50/50 to-amber-50/30 rounded-r-lg space-y-6'>
              <h2 className='text-xl font-semibold text-pink-900 mb-4'>Basic Information</h2>

              <div>
                <label htmlFor='name' className='block text-sm font-medium text-pink-950 mb-1'>Startup Name</label>
                <input type='text' id='name' name='name' value={formData.name} onChange={handleChange}
                  className='w-full px-4 py-3 text-xl bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all'
                  placeholder='e.g., InnovateX' required />
              </div>

              <div>
                <label htmlFor='short_description' className='block text-sm font-medium text-pink-950 mb-1'>Short Description / Tagline</label>
                <input type='text' id='short_description' name='short_description' value={formData.short_description} onChange={handleChange}
                  className='w-full px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all'
                  placeholder='Revolutionizing the future of...' required />
              </div>

              <div>
                <label htmlFor='website_url' className='block text-sm font-medium text-pink-950 mb-1'>Website URL</label>
                <div className='relative'>
                  <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                    <LinkIcon className='h-5 w-5 text-gray-400' />
                  </div>
                  <input type='url' id='website_url' name='website_url' value={formData.website_url} onChange={handleChange}
                    className='w-full pl-10 pr-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all'
                    placeholder='https://www.yourstartup.com' required />
                </div>
              </div>
            </div>

            {/* Section 2: Mission & Problem */}
            <div className='p-6 border-l-4 border-amber-400 bg-gradient-to-r from-amber-50/30 to-pink-50/30 rounded-r-lg space-y-6'>
              <h2 className='text-xl font-semibold text-amber-900 mb-4'>Why We Exist & What We Solve</h2>

              <div>
                <label htmlFor='mission_statement' className='block text-sm font-medium text-amber-950 mb-1'>
                  <Lightbulb className='inline h-4 w-4 mr-1' />
                  Mission Statement - Why We Exist
                </label>
                <textarea
                  id='mission_statement'
                  name='mission_statement'
                  value={formData.mission_statement}
                  onChange={handleChange}
                  className='w-full px-4 py-3 bg-white border border-amber-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/30 transition-all resize-none overflow-hidden min-h-[80px]'
                  rows={1}
                  placeholder='Our mission is to transform how people...'
                />
              </div>

              <div>
                <label htmlFor='problem_solution' className='block text-sm font-medium text-amber-950 mb-1'>The Problem We&apos;re Solving & Our Solution</label>
                <textarea
                  id='problem_solution'
                  name='problem_solution'
                  value={formData.problem_solution}
                  onChange={handleChange}
                  className='w-full px-4 py-3 bg-white border border-amber-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/30 transition-all resize-none overflow-hidden min-h-[100px]'
                  rows={1}
                  placeholder='The problem: [Describe the pain point] Our solution: [How you solve it]'
                />
              </div>
            </div>

            {/* Section 3: Story & Market */}
            <div className='p-6 border-l-4 border-pink-500 bg-gradient-to-r from-pink-50/40 to-amber-50/40 rounded-r-lg space-y-6'>
              <h2 className='text-xl font-semibold text-pink-900 mb-4'>Our Story & Who We Serve</h2>

              <div>
                <label htmlFor='founder_story' className='block text-sm font-medium text-pink-950 mb-1'>Our Origin Story</label>
                <textarea
                  id='founder_story'
                  name='founder_story'
                  value={formData.founder_story}
                  onChange={handleChange}
                  className='w-full px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all resize-none overflow-hidden min-h-[100px]'
                  rows={1}
                  placeholder='How did this all start? What drove you to build this?'
                />
              </div>

              <div>
                <label htmlFor='target_market' className='block text-sm font-medium text-pink-950 mb-1'>
                  <Target className='inline h-4 w-4 mr-1' />
                  Who Needs This Most
                </label>
                <textarea
                  id='target_market'
                  name='target_market'
                  value={formData.target_market}
                  onChange={handleChange}
                  className='w-full px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all resize-none overflow-hidden min-h-[80px]'
                  rows={1}
                  placeholder='Target audience, market size, pain points we solve'
                />
              </div>
            </div>

            {/* Section 4: Traction & Proof */}
            <div className='p-6 border-l-4 border-amber-500 bg-gradient-to-r from-amber-50/40 to-pink-50/30 rounded-r-lg space-y-6'>
              <h2 className='text-xl font-semibold text-amber-900 mb-4'>Proof We&apos;re Not Just Talk</h2>

              <div>
                <label htmlFor='traction' className='block text-sm font-medium text-amber-950 mb-1'>
                  <Trophy className='inline h-4 w-4 mr-1' />
                  Current Traction & Growth
                </label>
                <textarea
                  id='traction'
                  name='traction'
                  value={formData.traction}
                  onChange={handleChange}
                  className='w-full px-4 py-3 bg-white border border-amber-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/30 transition-all resize-none overflow-hidden min-h-[80px]'
                  rows={1}
                  placeholder='Users: 10K+ active monthly, Revenue: $50K ARR, Growth: 20% MoM'
                />
              </div>

              <div>
                <label htmlFor='milestones' className='block text-sm font-medium text-amber-950 mb-1'>What We&apos;ve Achieved & What&apos;s Next</label>
                <textarea
                  id='milestones'
                  name='milestones'
                  value={formData.milestones}
                  onChange={handleChange}
                  className='w-full px-4 py-3 bg-white border border-amber-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/30 transition-all resize-none overflow-hidden min-h-[100px]'
                  rows={1}
                  placeholder='Past wins: Launched MVP, 1000+ beta users. Coming next: Series A funding, market expansion'
                />
              </div>

              <div>
                <label htmlFor='awards' className='block text-sm font-medium text-amber-950 mb-1'>Awards & Recognition</label>
                <textarea
                  id='awards'
                  name='awards'
                  value={formData.awards}
                  onChange={handleChange}
                  className='w-full px-4 py-3 bg-white border border-amber-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/30 transition-all resize-none overflow-hidden min-h-[80px]'
                  rows={1}
                  placeholder='TechCrunch Disrupt Winner 2024, Forbes 30 Under 30, Featured in Wired Magazine'
                />
              </div>
            </div>

            {/* Section 5: Team & Funding */}
            <div className='p-6 border-l-4 border-pink-600 bg-gradient-to-r from-pink-50/50 to-amber-50/50 rounded-r-lg space-y-6'>
              <h2 className='text-xl font-semibold text-pink-900 mb-4'>Team & Investment</h2>

              <div>
                <label htmlFor='team_profiles' className='block text-sm font-medium text-pink-950 mb-1'>
                  <Users className='inline h-4 w-4 mr-1' />
                  Meet the Team
                </label>
                <textarea
                  id='team_profiles'
                  name='team_profiles'
                  value={formData.team_profiles}
                  onChange={handleChange}
                  className='w-full px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all resize-none overflow-hidden min-h-[100px]'
                  rows={1}
                  placeholder='John Doe - CEO, Ex-Google engineer. Jane Smith - CTO, 10+ years AI experience'
                />
              </div>

              <div>
                <label htmlFor='use_of_funds' className='block text-sm font-medium text-pink-950 mb-1'>How We&apos;ll Use the Investment</label>
                <textarea
                  id='use_of_funds'
                  name='use_of_funds'
                  value={formData.use_of_funds}
                  onChange={handleChange}
                  className='w-full px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all resize-none overflow-hidden min-h-[80px]'
                  rows={1}
                  placeholder='60% Product development, 25% Marketing & growth, 15% Operations'
                />
              </div>
            </div>

            {/* Section 6: Additional Details */}
            <div className='space-y-6'>
              <h2 className='text-xl font-semibold text-pink-900 mb-4'>Additional Details</h2>

              <div>
                <label htmlFor='description' className='block text-sm font-medium text-pink-950 mb-1'>Detailed Description</label>
                <textarea
                  id='description'
                  name='description'
                  value={formData.description}
                  onChange={handleChange}
                  className='w-full px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all resize-none overflow-hidden min-h-[120px]'
                  rows={1}
                  placeholder='What we do: Brief overview. How it works: Step-by-step process. Why now: Market timing and opportunity'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-pink-950 mb-2'>Startup Logo or Related Image</label>
                <div className='mt-2 flex items-center gap-x-6'>
                  {logoPreview ? (
                    <Image src={logoPreview} alt="Logo Preview" className="h-20 w-20 rounded-full object-cover border-2 border-pink-200" width={80} height={80} />
                  ) : (
                    <div className='h-20 w-20 flex justify-center items-center rounded-full bg-gradient-to-br from-pink-100 to-amber-100'>
                      <Briefcase className='h-10 w-10 text-pink-600' />
                    </div>
                  )}
                  <label htmlFor='image_file' className='cursor-pointer rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-pink-800 shadow-sm ring-1 ring-inset ring-pink-300 hover:bg-pink-50 transition'>
                    Upload Image
                    <input id='image_file' name='image_file' type='file' className='sr-only' onChange={handleFileChange} accept='image/png, image/jpeg, image/svg+xml' />
                  </label>
                  <p className="text-sm text-gray-500 font-medium">OR</p>
                  <input type="text" id='image_url' name="image_url" value={formData.image_url} className='min-w-[300px] px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all'
                   placeholder='Paste Image url here' onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Section 7: Follower Update Message (Only for Editing) */}
            {isEditing && (
              <div className='p-6 border-l-4 border-green-400 bg-gradient-to-r from-green-50/30 to-pink-50/30 rounded-r-lg space-y-6'>
                <h2 className='text-xl font-semibold text-green-900 mb-4'>Notify Your Followers</h2>
                <div>
                  <label htmlFor='follower_message' className='block text-sm font-medium text-green-950 mb-1'>Custom Message to Followers (Optional)</label>
                  <textarea
                    id='follower_message'
                    name='follower_message'
                    value={formData.follower_message}
                    onChange={handleChange}
                    className='w-full px-4 py-3 bg-white border border-green-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/30 transition-all resize-none overflow-hidden min-h-[100px]'
                    rows={1}
                    placeholder='Share what&apos;s new with your startup updates...'
                  />
                  <p className='text-sm text-gray-600 mt-1'>This message will be sent via email to all your followers when you update your startup.</p>
                </div>
              </div>
            )}


            {/* Section 7: Tags and Funding */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8'>
              {/* Location */}
              <div>
                <label htmlFor='location' className='block text-sm font-medium text-pink-950 mb-1'>Location</label>
                <input
                  type='text'
                  id='location'
                  name='location'
                  value={formData.location}
                  onChange={handleChange}
                  className='w-full px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all'
                  placeholder='City, State, Country'
                  required
                />
              </div>

              {/* Tags */}
              <div className='md:col-span-2' ref={tagsDropdownRef}>
                <label className='block text-sm font-medium text-pink-950 mb-1'>Select Tags</label>
                <div className='relative'>
                  <button type='button' onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)} className='w-full px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm text-left flex justify-between items-center'>
                    <span className='flex flex-wrap gap-2'>
                      {formData.tags.length > 0 ? formData.tags.map(tag => (
                        <span key={tag} className='bg-gradient-to-r from-pink-600 to-amber-600 text-white text-xs font-medium px-3 py-1 rounded-full'>{tag}</span>
                      )) : <span className='text-gray-400'>Choose tags for your startup</span>}
                    </span>
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isTagDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isTagDropdownOpen && (
                    <div className='absolute z-10 mt-2 w-full bg-white shadow-lg border border-pink-200 rounded-lg max-h-60 overflow-auto p-3'>
                      <div className='flex flex-wrap gap-2'>
                        {INDUSTRY_TAGS.map(tag => (
                          <button key={tag} type='button' onClick={() => handleTagSelect(tag)}
                            className={`capitalize rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${formData.tags.includes(tag)
                              ? 'bg-gradient-to-r from-pink-600 to-amber-600 text-white shadow-md'
                              : 'bg-gradient-to-r from-gray-100 to-amber-50 text-gray-700 hover:from-pink-100 hover:to-amber-100 hover:text-pink-800'}`}>
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Funding Stage */}
              <div>
                <label htmlFor='funding_stage' className='block text-sm font-medium text-pink-950 mb-1'>Funding Stage</label>
                <select id='funding_stage' name='funding_stage' value={formData.funding_stage} onChange={handleChange}
                  className='w-full px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all' required>
                  <option>Pre-seed</option>
                  <option>Seed</option>
                  <option>Series A</option>
                  <option>Series B</option>
                  <option>Series C+</option>
                  <option>Bootstrapped</option>
                </select>
              </div>

              {/* Support Link */}
              <div>
                <label htmlFor='account_details' className='block text-sm font-medium text-pink-950 mb-1'>UPI Link (Optional)</label>
                <div className='relative'>
                  <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                    <Wallet className='h-5 w-5 text-amber-500' />
                  </div>
                  <input type='text' id='account_details' name='account_details' value={formData.account_details} onChange={handleChange}
                    className='w-full pl-10 pr-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all'
                    placeholder='e.g., your Patreon or Stripe link' />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className='pt-8 flex justify-end gap-4'>
              <button
                type='button'
                onClick={handleCancel}
                disabled={isLoading}
                className='px-8 py-3 rounded-lg text-sm font-semibold text-gray-800 bg-gray-200 hover:bg-gray-300 transition-colors disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isLoading}
                className='px-8 py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-pink-600 to-amber-600 hover:from-pink-700 hover:to-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isLoading ? 'Processing...' : (isEditing ? 'Update Startup' : 'Submit Startup')}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function AddStartupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsWrapper>
        {(edit) => <AddStartupPageContent edit={edit} />}
      </SearchParamsWrapper>
    </Suspense>
  );
}
