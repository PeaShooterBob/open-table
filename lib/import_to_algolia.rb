require 'json'
require 'csv'
require 'dotenv'
require 'algoliasearch'
class ImportToAlgolia
  def self.json_to_array_of_hashes
    file = File.read('../resources/dataset/restaurants_list.json')
    JSON.parse(file)
  end

  def self.csv_to_array_of_hahses
    records = []
      CSV.foreach('../resources/dataset/restaurants_info.csv', {col_sep: ';', headers: true}) do |row|
      row['stars'] = row['stars_count'].to_i.round
      records << row.to_hash
    end
    records
  end

  def self.get_data
    json_data = json_to_array_of_hashes.sort_by { |record| record['objectID']}
    csv_data = csv_to_array_of_hahses.sort_by { |record| record['objectID'].to_i }

    json_data.each_with_index.map do |record, index|
      record.merge(csv_data[index])
    end
  end

  def self.import
    Algolia.init :application_id => '52C0QP0KEX', :api_key => ENV['API_KEY']

    index = Algolia::Index.new('Restaurants')
    index.set_settings({
      'attributesToIndex' => ['name', 'food_type', 'city', 'neighborhood'],
      'attributesForFaceting' => ['food_type', 'stars', 'payment_options']
    })
    get_data.each_slice(1000) do |batch|
      index.add_objects(batch)
    end
  end
end

Dotenv.load
ImportToAlgolia.import
