Feature: Invalid quantity
  As a user of the Vegetable Counter
  I want to be protected from nonsensical quantities
  So that my remaining counts always make sense

  Scenario: Eating more than what is in stock is rejected
    Given I am on the Vegetable Counter page
    And I have 2 cucumbers in stock
    And I eat 3 cucumbers
    When I calculate the remaining vegetables
    Then the application should warn me that I cannot eat 3 cucumbers when I only have 2
    And the total should show a dash instead of a number
