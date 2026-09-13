Feature: Scenario outlines and data tables
  As a quality-conscious team
  I want to express many variations of the same behaviour compactly
  So that I avoid duplicating near-identical scenarios

  # Why this feature file?
  #
  # Several of the existing scenarios repeat the exact same steps with only
  # different values (e.g. cucumbers vs carrots). Cucumber gives us two tools
  # to express that without copy-pasting:
  #
  #   * Scenario Outlines with an Examples table  -> one shape, many values
  #   * Data Tables in a single step              -> many rows of input at once
  #
  # The required scenarios stay as explicit one-off scenarios (they are the
  # acceptance criteria and read well standalone). The scenarios here add
  # breadth cheaply and prove the same rules hold across every vegetable.

  @smoke
  Scenario Outline: Remaining vegetables are stock minus eaten
    Given I am on the Vegetable Counter page
    And I have <stock> <veg> in stock
    And I eat <eaten> <veg>
    When I calculate the remaining vegetables
    Then the application should show <remaining> <veg> remaining

    Examples:
      | veg       | stock | eaten | remaining |
      | cucumbers | 5     | 3     | 2         |
      | carrots   | 10    | 3     | 7         |
      | tomatoes  | 4     | 4     | 0         |
      | peppers   | 8     | 0     | 8         |

  Scenario Outline: Eating more than what is in stock is rejected
    Given I am on the Vegetable Counter page
    And I have <stock> <veg> in stock
    And I eat <eaten> <veg>
    When I calculate the remaining vegetables
    Then the application should warn me that I cannot eat <eaten> <veg> when I only have <stock>
    And the total should show a dash instead of a number

    Examples:
      | veg       | stock | eaten |
      | cucumbers | 2     | 3     |
      | carrots   | 1     | 5     |
      | tomatoes  | 3     | 10    |
      | peppers   | 0     | 2     |

  Scenario Outline: Invalid stock values are rejected with a clear message
    Given I am on the Vegetable Counter page
    And I enter "<value>" as the number of <veg> in stock
    When I calculate the remaining vegetables
    Then I should see an error about the quantity for <veg>
    And the total should show a dash instead of a number

    Examples:
      | veg       | value  |
      | cucumbers | abc    |
      | carrots   | -2     |
      | tomatoes  | 3.5    |
      | peppers   | twelve |

  Scenario: A data table enters many vegetables and shows the combined total
    Given I am on the Vegetable Counter page
    And the following vegetables are in stock:
      | vegetable | stock | eaten |
      | cucumbers | 8     | 3     |
      | carrots   | 5     | 2     |
      | tomatoes  | 6     | 6     |
      | peppers   | 4     | 1     |
    When I calculate the remaining vegetables
    Then the application should show 5 cucumbers remaining
    And the application should show 3 carrots remaining
    And the application should show 0 tomatoes remaining
    And the application should show 3 peppers remaining
    And the application should show 11 vegetables remaining in total
