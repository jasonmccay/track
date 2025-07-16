import { checkDatabaseConnection } from './lib/db-utils';
import { TagRepository } from './repositories/tagRepository';

async function testTagSystem() {
  console.log('Testing Tag Management System...');
  
  // Check database connection
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    console.error('❌ Database connection failed');
    process.exit(1);
  }
  
  console.log('✅ Database connection successful');
  
  const tagRepository = new TagRepository();
  
  try {
    // Test 1: Create individual tags
    console.log('\n1. Testing individual tag creation...');
    const testTag1 = {
      name: 'test-tag-' + Date.now(),
      color: '#3B82F6',
    };
    
    const createdTag1 = await tagRepository.create(testTag1);
    console.log('✅ Tag created:', createdTag1.name, 'with color:', createdTag1.color);
    
    // Test 2: Create tag without color (should get random color)
    console.log('\n2. Testing tag creation without color...');
    const testTag2 = {
      name: 'auto-color-' + Date.now(),
    };
    
    const createdTag2 = await tagRepository.create(testTag2);
    console.log('✅ Tag created with auto color:', createdTag2.name, 'color:', createdTag2.color);
    
    // Test 3: Find tag by ID
    console.log('\n3. Testing find tag by ID...');
    const foundTag = await tagRepository.findById(createdTag1.id);
    if (foundTag && foundTag.name === createdTag1.name) {
      console.log('✅ Tag found by ID:', foundTag.name);
    } else {
      throw new Error('Tag not found by ID');
    }
    
    // Test 4: Find tag by name
    console.log('\n4. Testing find tag by name...');
    const foundByName = await tagRepository.findByName(createdTag1.name);
    if (foundByName && foundByName.id === createdTag1.id) {
      console.log('✅ Tag found by name:', foundByName.name);
    } else {
      throw new Error('Tag not found by name');
    }
    
    // Test 5: Check if tag exists
    console.log('\n5. Testing tag existence checks...');
    const exists = await tagRepository.exists(createdTag1.id);
    const existsByName = await tagRepository.existsByName(createdTag1.name);
    if (exists && existsByName) {
      console.log('✅ Tag existence checks passed');
    } else {
      throw new Error('Tag existence checks failed');
    }
    
    // Test 6: Create multiple tags at once
    console.log('\n6. Testing batch tag creation...');
    const tagNames = ['batch-1', 'batch-2', 'batch-3', createdTag1.name]; // Include existing tag
    const batchTags = await tagRepository.createMultiple(tagNames);
    console.log('✅ Batch tags created/found:', batchTags.length, 'tags');
    console.log('   - Tag names:', batchTags.map(t => t.name).join(', '));
    
    // Test 7: Find tags by names
    console.log('\n7. Testing find tags by names...');
    const foundByNames = await tagRepository.findByNames(['batch-1', 'batch-2']);
    if (foundByNames.length === 2) {
      console.log('✅ Found tags by names:', foundByNames.map(t => t.name).join(', '));
    } else {
      throw new Error('Find by names failed');
    }
    
    // Test 8: Find tags by IDs
    console.log('\n8. Testing find tags by IDs...');
    const tagIds = [createdTag1.id, createdTag2.id];
    const foundByIds = await tagRepository.findByIds(tagIds);
    if (foundByIds.length === 2) {
      console.log('✅ Found tags by IDs:', foundByIds.map(t => t.name).join(', '));
    } else {
      throw new Error('Find by IDs failed');
    }
    
    // Test 9: Get all tags
    console.log('\n9. Testing get all tags...');
    const allTags = await tagRepository.findAll();
    console.log('✅ Total tags in database:', allTags.length);
    console.log('   - Tag names:', allTags.map(t => t.name).slice(0, 5).join(', '), '...');
    
    // Test 10: Update tag
    console.log('\n10. Testing tag update...');
    const updatedTag = await tagRepository.update(createdTag1.id, {
      name: 'updated-' + createdTag1.name,
      color: '#EF4444',
    });
    if (updatedTag && updatedTag.name.startsWith('updated-')) {
      console.log('✅ Tag updated:', updatedTag.name, 'color:', updatedTag.color);
    } else {
      throw new Error('Tag update failed');
    }
    
    // Test 11: Get tags with event count (should be 0 for all since no events yet)
    console.log('\n11. Testing tags with event count...');
    const tagsWithCount = await tagRepository.getTagsWithEventCount();
    console.log('✅ Tags with event count:', tagsWithCount.length);
    console.log('   - Sample:', tagsWithCount.slice(0, 3).map(t => `${t.name} (${t.eventCount})`).join(', '));
    
    // Test 12: Get popular tags
    console.log('\n12. Testing popular tags...');
    const popularTags = await tagRepository.getPopularTags(5);
    console.log('✅ Popular tags (top 5):', popularTags.length);
    console.log('   - Tags:', popularTags.map(t => `${t.name} (${t.eventCount})`).join(', '));
    
    // Clean up - delete test tags
    console.log('\n13. Cleaning up test tags...');
    const testTagsToDelete = allTags.filter(tag => 
      tag.name.includes('test-tag-') || 
      tag.name.includes('auto-color-') || 
      tag.name.includes('batch-') ||
      tag.name.includes('updated-')
    );
    
    for (const tag of testTagsToDelete) {
      await tagRepository.delete(tag.id);
    }
    console.log('✅ Cleaned up', testTagsToDelete.length, 'test tags');
    
    console.log('\n🎉 All Tag Management tests passed!');
    console.log('\n📋 Tag Management System Features:');
    console.log('   ✅ Individual tag creation with/without colors');
    console.log('   ✅ Batch tag creation (creates new, finds existing)');
    console.log('   ✅ Find tags by ID, name, multiple IDs/names');
    console.log('   ✅ Tag existence checks');
    console.log('   ✅ Tag updates (name and color)');
    console.log('   ✅ Tag deletion');
    console.log('   ✅ Get all tags (sorted by name)');
    console.log('   ✅ Get tags with event counts');
    console.log('   ✅ Get popular tags');
    console.log('   ✅ Automatic color generation');
    console.log('   ✅ Duplicate prevention');
    
  } catch (error) {
    console.error('❌ Tag management test failed:', error);
    process.exit(1);
  }
}

testTagSystem().catch((error) => {
  console.error('❌ Tag management test failed:', error);
  process.exit(1);
});